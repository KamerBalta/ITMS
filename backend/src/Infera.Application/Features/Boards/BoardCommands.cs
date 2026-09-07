using Infera.Application.Common.Interfaces;
using Infera.Application.Features.Workflow;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Boards;

public record GetBoardsQuery(Guid ProjectId) : IRequest<List<BoardDto>>;
public record CreateBoardCommand(Guid ProjectId, string Name, string BoardType) : IRequest<Guid>;
public record UpdateBoardCommand(Guid BoardId, string Name) : IRequest;
public record DeleteBoardCommand(Guid BoardId) : IRequest;

public record BoardDto(Guid Id, string Name, string BoardType);

public static class BoardTypes
{
    public static readonly string[] All = { "Scrum", "Kanban" };
}

public class GetBoardsQueryHandler : IRequestHandler<GetBoardsQuery, List<BoardDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public GetBoardsQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<List<BoardDto>> Handle(GetBoardsQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.Boards
            .Where(b => b.ProjectId == request.ProjectId)
            .OrderBy(b => b.CreatedAt)
            .Select(b => new BoardDto(b.Id, b.Name, b.BoardType))
            .ToListAsync(ct);
    }
}

public class CreateBoardCommandHandler : IRequestHandler<CreateBoardCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public CreateBoardCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateBoardCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        if (!BoardTypes.All.Contains(request.BoardType))
            throw new InvalidOperationException("Board tipi 'Scrum' veya 'Kanban' olmalıdır.");

        var exists = await _db.Boards.AnyAsync(b => b.ProjectId == request.ProjectId && b.Name == request.Name, ct);
        if (exists) throw new InvalidOperationException("Bu isimde bir board zaten var.");

        var board = new Board { ProjectId = request.ProjectId, Name = request.Name, BoardType = request.BoardType };
        _db.Boards.Add(board);
        await _db.SaveChangesAsync(ct);

        // #11: yeni board'un kendi kolon seti olmali -- bos baslamak yerine, projenin
        // MEVCUT durumlarina gore makul bir varsayilan kolon duzeni otomatik kuruluyor
        // (her Status kendi adiyla bir kolona 1:1 eslenir, kullanici sonra Board Settings'ten
        // birlestirip duzenleyebilir).
        var statuses = await _db.ProjectWorkflowStatuses.Where(s => s.ProjectId == request.ProjectId && !s.IsDraft).OrderBy(s => s.DisplayOrder).ToListAsync(ct);
        var columns = new List<BoardColumn>();
        for (int i = 0; i < statuses.Count; i++)
        {
            var col = new BoardColumn { BoardId = board.Id, Name = statuses[i].Name, DisplayOrder = i };
            columns.Add(col);
            _db.BoardColumns.Add(col);
        }
        await _db.SaveChangesAsync(ct);

        for (int i = 0; i < statuses.Count; i++)
            _db.BoardStatusColumnMappings.Add(new BoardStatusColumnMapping { BoardId = board.Id, StatusId = statuses[i].Id, ColumnId = columns[i].Id });

        await _db.SaveChangesAsync(ct);
        return board.Id;
    }
}

public class UpdateBoardCommandHandler : IRequestHandler<UpdateBoardCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public UpdateBoardCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(UpdateBoardCommand request, CancellationToken ct)
    {
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == request.BoardId, ct) ?? throw new KeyNotFoundException("Board bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(board.ProjectId, ct);
        board.Name = request.Name;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteBoardCommandHandler : IRequestHandler<DeleteBoardCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public DeleteBoardCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(DeleteBoardCommand request, CancellationToken ct)
    {
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == request.BoardId, ct) ?? throw new KeyNotFoundException("Board bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(board.ProjectId, ct);

        var otherBoardsCount = await _db.Boards.CountAsync(b => b.ProjectId == board.ProjectId, ct);
        if (otherBoardsCount <= 1)
            throw new InvalidOperationException("Bir projenin en az bir board'u olmalıdır.");

        var columns = await _db.BoardColumns.Where(c => c.BoardId == board.Id).ToListAsync(ct);
        var columnIds = columns.Select(c => c.Id).ToList();

        _db.BoardStatusColumnMappings.RemoveRange(_db.BoardStatusColumnMappings.Where(m => m.BoardId == board.Id));
        _db.BoardColumnSettings.RemoveRange(_db.BoardColumnSettings.Where(s => s.BoardId == board.Id));
        _db.BoardColumns.RemoveRange(columns);
        _db.Boards.Remove(board);
        await _db.SaveChangesAsync(ct);
    }
}