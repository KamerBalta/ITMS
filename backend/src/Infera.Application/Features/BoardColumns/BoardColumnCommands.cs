using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.BoardColumns;

public record GetBoardColumnsQuery(Guid BoardId) : IRequest<List<BoardColumnDto>>;
public record CreateBoardColumnCommand(Guid BoardId, string Name) : IRequest<Guid>;
public record UpdateBoardColumnCommand(Guid Id, string Name) : IRequest;
public record DeleteBoardColumnCommand(Guid Id) : IRequest;
public record ReorderBoardColumnsCommand(Guid BoardId, List<Guid> OrderedIds) : IRequest;
public record MapStatusToColumnCommand(Guid BoardId, Guid StatusId, Guid? ColumnId) : IRequest;

public record BoardColumnDto(Guid Id, string Name, int DisplayOrder, List<BoardColumnStatusDto> Statuses);
public record BoardColumnStatusDto(Guid Id, string Name, string Category);

file static class BoardOwnershipHelper
{
    public static async System.Threading.Tasks.Task<Guid> GetProjectIdAsync(IAppDbContext db, Guid boardId, CancellationToken ct)
    {
        var board = await db.Boards.FirstOrDefaultAsync(b => b.Id == boardId, ct) ?? throw new KeyNotFoundException("Board bulunamadı.");
        return board.ProjectId;
    }
}

public class GetBoardColumnsQueryHandler : IRequestHandler<GetBoardColumnsQuery, List<BoardColumnDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public GetBoardColumnsQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<List<BoardColumnDto>> Handle(GetBoardColumnsQuery request, CancellationToken ct)
    {
        var projectId = await BoardOwnershipHelper.GetProjectIdAsync(_db, request.BoardId, ct);
        if (!await _access.HasProjectAccessAsync(projectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var columns = await _db.BoardColumns.Where(c => c.BoardId == request.BoardId).OrderBy(c => c.DisplayOrder).ToListAsync(ct);
        var mappings = await _db.BoardStatusColumnMappings.Where(m => m.BoardId == request.BoardId).Include(m => m.Status).ToListAsync(ct);

        var result = columns.Select(c => new BoardColumnDto(
            c.Id, c.Name, c.DisplayOrder,
            mappings.Where(m => m.ColumnId == c.Id).Select(m => new BoardColumnStatusDto(m.Status.Id, m.Status.Name, m.Status.Category)).ToList()
        )).ToList();

        var mappedStatusIds = mappings.Select(m => m.StatusId).ToHashSet();
        var allStatuses = await _db.ProjectWorkflowStatuses.Where(s => s.ProjectId == projectId && !s.IsDraft).ToListAsync(ct);
        var unmapped = allStatuses.Where(s => !mappedStatusIds.Contains(s.Id)).ToList();

        if (unmapped.Count > 0)
        {
            result.Add(new BoardColumnDto(
                Guid.Empty, "Eşlenmemiş Durumlar (Board Settings'ten bir Column'a atayın)", int.MaxValue,
                unmapped.Select(s => new BoardColumnStatusDto(s.Id, s.Name, s.Category)).ToList()));
        }

        return result;
    }
}

public class CreateBoardColumnCommandHandler : IRequestHandler<CreateBoardColumnCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public CreateBoardColumnCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateBoardColumnCommand request, CancellationToken ct)
    {
        var projectId = await BoardOwnershipHelper.GetProjectIdAsync(_db, request.BoardId, ct);
        await _projectAuth.EnsureProjectManagerOrAdminAsync(projectId, ct);

        var exists = await _db.BoardColumns.AnyAsync(c => c.BoardId == request.BoardId && c.Name == request.Name, ct);
        if (exists) throw new InvalidOperationException("Bu isimde bir column zaten var.");

        var maxOrder = await _db.BoardColumns.Where(c => c.BoardId == request.BoardId).Select(c => (int?)c.DisplayOrder).MaxAsync(ct) ?? -1;
        var entity = new BoardColumn { BoardId = request.BoardId, Name = request.Name, DisplayOrder = maxOrder + 1 };
        _db.BoardColumns.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class UpdateBoardColumnCommandHandler : IRequestHandler<UpdateBoardColumnCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public UpdateBoardColumnCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(UpdateBoardColumnCommand request, CancellationToken ct)
    {
        var entity = await _db.BoardColumns.FirstOrDefaultAsync(c => c.Id == request.Id, ct) ?? throw new KeyNotFoundException("Column bulunamadı.");
        var projectId = await BoardOwnershipHelper.GetProjectIdAsync(_db, entity.BoardId, ct);
        await _projectAuth.EnsureProjectManagerOrAdminAsync(projectId, ct);
        entity.Name = request.Name;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteBoardColumnCommandHandler : IRequestHandler<DeleteBoardColumnCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public DeleteBoardColumnCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(DeleteBoardColumnCommand request, CancellationToken ct)
    {
        var entity = await _db.BoardColumns.FirstOrDefaultAsync(c => c.Id == request.Id, ct) ?? throw new KeyNotFoundException("Column bulunamadı.");
        var projectId = await BoardOwnershipHelper.GetProjectIdAsync(_db, entity.BoardId, ct);
        await _projectAuth.EnsureProjectManagerOrAdminAsync(projectId, ct);

        var hasMappings = await _db.BoardStatusColumnMappings.AnyAsync(m => m.ColumnId == request.Id, ct);
        if (hasMappings) throw new InvalidOperationException("Bu column'a atanmış durumlar var, önce onları başka bir column'a taşıyın.");

        _db.BoardColumns.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}

public class ReorderBoardColumnsCommandHandler : IRequestHandler<ReorderBoardColumnsCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public ReorderBoardColumnsCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(ReorderBoardColumnsCommand request, CancellationToken ct)
    {
        var projectId = await BoardOwnershipHelper.GetProjectIdAsync(_db, request.BoardId, ct);
        await _projectAuth.EnsureProjectManagerOrAdminAsync(projectId, ct);

        var columns = await _db.BoardColumns.Where(c => c.BoardId == request.BoardId).ToListAsync(ct);
        if (columns.Count != request.OrderedIds.Count || columns.Select(c => c.Id).Except(request.OrderedIds).Any())
            throw new InvalidOperationException("Sıralama listesi bu board'un tüm column'larını içermelidir.");
        for (int i = 0; i < request.OrderedIds.Count; i++)
            columns.First(c => c.Id == request.OrderedIds[i]).DisplayOrder = i;
        await _db.SaveChangesAsync(ct);
    }
}

public class MapStatusToColumnCommandHandler : IRequestHandler<MapStatusToColumnCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public MapStatusToColumnCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(MapStatusToColumnCommand request, CancellationToken ct)
    {
        var projectId = await BoardOwnershipHelper.GetProjectIdAsync(_db, request.BoardId, ct);
        await _projectAuth.EnsureProjectManagerOrAdminAsync(projectId, ct);

        var status = await _db.ProjectWorkflowStatuses.FirstOrDefaultAsync(s => s.Id == request.StatusId && s.ProjectId == projectId, ct)
            ?? throw new KeyNotFoundException("Durum bulunamadı.");

        var existing = await _db.BoardStatusColumnMappings.FirstOrDefaultAsync(m => m.BoardId == request.BoardId && m.StatusId == request.StatusId, ct);

        if (request.ColumnId is null)
        {
            if (existing is not null) _db.BoardStatusColumnMappings.Remove(existing);
        }
        else
        {
            var columnExists = await _db.BoardColumns.AnyAsync(c => c.Id == request.ColumnId && c.BoardId == request.BoardId, ct);
            if (!columnExists) throw new KeyNotFoundException("Column bulunamadı.");

            if (existing is null)
                _db.BoardStatusColumnMappings.Add(new BoardStatusColumnMapping { BoardId = request.BoardId, StatusId = request.StatusId, ColumnId = request.ColumnId.Value });
            else
                existing.ColumnId = request.ColumnId.Value;
        }

        await _db.SaveChangesAsync(ct);
    }
}