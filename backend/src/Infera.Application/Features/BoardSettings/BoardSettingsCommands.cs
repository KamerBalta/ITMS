using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.BoardSettings;

public record GetBoardColumnSettingsQuery(Guid ProjectId) : IRequest<List<BoardColumnSettingDto>>;
public record UpdateWipLimitCommand(Guid ProjectId, Guid ColumnId, int? WipLimit) : IRequest;
public record BoardColumnSettingDto(Guid BoardColumnId, int? WipLimit);

public class GetBoardColumnSettingsQueryHandler : IRequestHandler<GetBoardColumnSettingsQuery, List<BoardColumnSettingDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetBoardColumnSettingsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<BoardColumnSettingDto>> Handle(GetBoardColumnSettingsQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.BoardColumnSettings
            .Where(s => s.ProjectId == request.ProjectId)
            .Select(s => new BoardColumnSettingDto(s.BoardColumnId, s.WipLimit))
            .ToListAsync(ct);
    }
}

public class UpdateWipLimitCommandHandler : IRequestHandler<UpdateWipLimitCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    private readonly IRealtimeNotifier _realtime;

    public UpdateWipLimitCommandHandler(
        IAppDbContext db,
        IProjectManagementAuthService projectAuth,
        IRealtimeNotifier realtime)
    {
        _db = db;
        _projectAuth = projectAuth;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task Handle(UpdateWipLimitCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        if (request.WipLimit is not null && request.WipLimit < 0)
            throw new InvalidOperationException("WIP limiti negatif olamaz.");

        var setting = await _db.BoardColumnSettings
            .FirstOrDefaultAsync(s => s.ProjectId == request.ProjectId && s.BoardColumnId == request.ColumnId, ct);

        if (setting is null)
        {
            _db.BoardColumnSettings.Add(new BoardColumnSetting
            {
                ProjectId = request.ProjectId,
                BoardColumnId = request.ColumnId,
                WipLimit = request.WipLimit
            });
        }
        else
        {
            setting.WipLimit = request.WipLimit;
        }

        await _db.SaveChangesAsync(ct);

        await _realtime.NotifyProjectAsync(request.ProjectId, "board-columns", "wip-limit-changed", ct);
    }
}