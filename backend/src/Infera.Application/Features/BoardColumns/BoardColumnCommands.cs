using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.BoardColumns;

public record GetBoardColumnsQuery(Guid ProjectId) : IRequest<List<BoardColumnDto>>;
public record CreateBoardColumnCommand(Guid ProjectId, string Name) : IRequest<Guid>;
public record UpdateBoardColumnCommand(Guid Id, string Name) : IRequest;
public record DeleteBoardColumnCommand(Guid Id) : IRequest;
public record ReorderBoardColumnsCommand(Guid ProjectId, List<Guid> OrderedIds) : IRequest;
public record MapStatusToColumnCommand(Guid ProjectId, Guid StatusId, Guid? ColumnId) : IRequest;

public record BoardColumnDto(Guid Id, string Name, int DisplayOrder, List<BoardColumnStatusDto> Statuses);
public record BoardColumnStatusDto(Guid Id, string Name, string Category);

public class GetBoardColumnsQueryHandler : IRequestHandler<GetBoardColumnsQuery, List<BoardColumnDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetBoardColumnsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<BoardColumnDto>> Handle(GetBoardColumnsQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var columns = await _db.BoardColumns
            .Where(c => c.ProjectId == request.ProjectId)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync(ct);

        var statuses = await _db.ProjectWorkflowStatuses
            .Where(s => s.ProjectId == request.ProjectId && !s.IsDraft)
            .ToListAsync(ct);

        var result = columns.Select(c => new BoardColumnDto(
            c.Id,
            c.Name,
            c.DisplayOrder,
            statuses
                .Where(s => s.BoardColumnId == c.Id)
                .Select(s => new BoardColumnStatusDto(s.Id, s.Name, s.Category))
                .ToList()
        )).ToList();

        // #Board-Fix: Hiçbir Column'a eşlenmemiş (BoardColumnId = null) Status'lar varsa,
        // bunları GÖRMEZDEN GELMEK yerine sonuna sanal bir "Eşlenmemiş" column olarak ekliyoruz.
        var unmappedStatuses = statuses.Where(s => s.BoardColumnId == null).ToList();
        if (unmappedStatuses.Count > 0)
        {
            result.Add(new BoardColumnDto(
                Guid.Empty,
                "Eşlenmemiş Durumlar (Board Settings'ten bir Column'a atayın)",
                int.MaxValue,
                unmappedStatuses
                    .Select(s => new BoardColumnStatusDto(s.Id, s.Name, s.Category))
                    .ToList()
            ));
        }

        return result;
    }
}

public class CreateBoardColumnCommandHandler : IRequestHandler<CreateBoardColumnCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    private readonly IRealtimeNotifier _realtime;

    public CreateBoardColumnCommandHandler(
        IAppDbContext db,
        IProjectManagementAuthService projectAuth,
        IRealtimeNotifier realtime)
    {
        _db = db;
        _projectAuth = projectAuth;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateBoardColumnCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var exists = await _db.BoardColumns.AnyAsync(c => c.ProjectId == request.ProjectId && c.Name == request.Name, ct);
        if (exists) throw new InvalidOperationException("Bu isimde bir column zaten var.");

        var maxOrder = await _db.BoardColumns
            .Where(c => c.ProjectId == request.ProjectId)
            .Select(c => (int?)c.DisplayOrder)
            .MaxAsync(ct) ?? -1;

        var entity = new BoardColumn
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            DisplayOrder = maxOrder + 1
        };

        _db.BoardColumns.Add(entity);
        await _db.SaveChangesAsync(ct);

        await _realtime.NotifyProjectAsync(request.ProjectId, "board-columns", "created", ct);

        return entity.Id;
    }
}

public class UpdateBoardColumnCommandHandler : IRequestHandler<UpdateBoardColumnCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    private readonly IRealtimeNotifier _realtime;

    public UpdateBoardColumnCommandHandler(
        IAppDbContext db,
        IProjectManagementAuthService projectAuth,
        IRealtimeNotifier realtime)
    {
        _db = db;
        _projectAuth = projectAuth;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task Handle(UpdateBoardColumnCommand request, CancellationToken ct)
    {
        var entity = await _db.BoardColumns.FirstOrDefaultAsync(c => c.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Column bulunamadı.");

        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);
        entity.Name = request.Name;
        await _db.SaveChangesAsync(ct);

        await _realtime.NotifyProjectAsync(entity.ProjectId, "board-columns", "renamed", ct);
    }
}

public class DeleteBoardColumnCommandHandler : IRequestHandler<DeleteBoardColumnCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    private readonly IRealtimeNotifier _realtime;

    public DeleteBoardColumnCommandHandler(
        IAppDbContext db,
        IProjectManagementAuthService projectAuth,
        IRealtimeNotifier realtime)
    {
        _db = db;
        _projectAuth = projectAuth;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task Handle(DeleteBoardColumnCommand request, CancellationToken ct)
    {
        var entity = await _db.BoardColumns.FirstOrDefaultAsync(c => c.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Column bulunamadı.");

        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);

        var hasStatuses = await _db.ProjectWorkflowStatuses.AnyAsync(s => s.BoardColumnId == request.Id, ct);
        if (hasStatuses)
            throw new InvalidOperationException("Bu column'a atanmış durumlar var, önce onları başka bir column'a taşıyın.");

        var projectId = entity.ProjectId;
        _db.BoardColumns.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _realtime.NotifyProjectAsync(projectId, "board-columns", "deleted", ct);
    }
}

public class ReorderBoardColumnsCommandHandler : IRequestHandler<ReorderBoardColumnsCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    private readonly IRealtimeNotifier _realtime;

    public ReorderBoardColumnsCommandHandler(
        IAppDbContext db,
        IProjectManagementAuthService projectAuth,
        IRealtimeNotifier realtime)
    {
        _db = db;
        _projectAuth = projectAuth;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task Handle(ReorderBoardColumnsCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var columns = await _db.BoardColumns.Where(c => c.ProjectId == request.ProjectId).ToListAsync(ct);
        if (columns.Count != request.OrderedIds.Count || columns.Select(c => c.Id).Except(request.OrderedIds).Any())
            throw new InvalidOperationException("Sıralama listesi bu projenin tüm column'larını içermelidir.");

        for (int i = 0; i < request.OrderedIds.Count; i++)
        {
            columns.First(c => c.Id == request.OrderedIds[i]).DisplayOrder = i;
        }

        await _db.SaveChangesAsync(ct);

        // #8: Board Settings'te yapilan degisiklik, ayni proje Board'una bakan HERKESE aninda yansir.
        await _realtime.NotifyProjectAsync(request.ProjectId, "board-columns", "reordered", ct);
    }
}

public class MapStatusToColumnCommandHandler : IRequestHandler<MapStatusToColumnCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    private readonly IRealtimeNotifier _realtime;

    public MapStatusToColumnCommandHandler(
        IAppDbContext db,
        IProjectManagementAuthService projectAuth,
        IRealtimeNotifier realtime)
    {
        _db = db;
        _projectAuth = projectAuth;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task Handle(MapStatusToColumnCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var status = await _db.ProjectWorkflowStatuses
            .FirstOrDefaultAsync(s => s.Id == request.StatusId && s.ProjectId == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Durum bulunamadı.");

        if (request.ColumnId is not null)
        {
            var columnExists = await _db.BoardColumns
                .AnyAsync(c => c.Id == request.ColumnId && c.ProjectId == request.ProjectId, ct);

            if (!columnExists)
                throw new KeyNotFoundException("Column bulunamadı.");
        }

        status.BoardColumnId = request.ColumnId;
        await _db.SaveChangesAsync(ct);

        await _realtime.NotifyProjectAsync(request.ProjectId, "board-columns", "status-mapped", ct);
    }
}