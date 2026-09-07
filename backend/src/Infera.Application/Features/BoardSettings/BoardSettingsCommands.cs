using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.BoardSettings;

public record GetBoardColumnSettingsQuery(Guid BoardId) : IRequest<List<BoardColumnSettingDto>>;
public record UpdateWipLimitCommand(Guid BoardId, Guid ColumnId, int? WipLimit) : IRequest;

public record BoardColumnSettingDto(Guid BoardColumnId, int? WipLimit);

public class GetBoardColumnSettingsQueryHandler : IRequestHandler<GetBoardColumnSettingsQuery, List<BoardColumnSettingDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public GetBoardColumnSettingsQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<List<BoardColumnSettingDto>> Handle(GetBoardColumnSettingsQuery request, CancellationToken ct)
    {
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == request.BoardId, ct) ?? throw new KeyNotFoundException("Board bulunamadı.");
        if (!await _access.HasProjectAccessAsync(board.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.BoardColumnSettings
            .Where(s => s.BoardId == request.BoardId)
            .Select(s => new BoardColumnSettingDto(s.BoardColumnId, s.WipLimit))
            .ToListAsync(ct);
    }
}

public class UpdateWipLimitCommandHandler : IRequestHandler<UpdateWipLimitCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public UpdateWipLimitCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(UpdateWipLimitCommand request, CancellationToken ct)
    {
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == request.BoardId, ct) ?? throw new KeyNotFoundException("Board bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(board.ProjectId, ct);

        if (request.WipLimit is not null && request.WipLimit < 0) throw new InvalidOperationException("WIP limiti negatif olamaz.");

        var setting = await _db.BoardColumnSettings.FirstOrDefaultAsync(s => s.BoardId == request.BoardId && s.BoardColumnId == request.ColumnId, ct);
        if (setting is null)
            _db.BoardColumnSettings.Add(new BoardColumnSetting { BoardId = request.BoardId, BoardColumnId = request.ColumnId, WipLimit = request.WipLimit });
        else
            setting.WipLimit = request.WipLimit;

        await _db.SaveChangesAsync(ct);
    }
}