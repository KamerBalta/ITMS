using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.BoardSettings;

public record GetBoardColumnSettingsQuery(Guid ProjectId) : IRequest<List<BoardColumnSettingDto>>;
public record UpdateWipLimitCommand(Guid ProjectId, string Status, int? WipLimit) : IRequest;
public record BoardColumnSettingDto(string Status, int? WipLimit);

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
            .Select(s => new BoardColumnSettingDto(s.Status, s.WipLimit))
            .ToListAsync(ct);
    }
}

public class UpdateWipLimitCommandHandler : IRequestHandler<UpdateWipLimitCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateWipLimitCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(
        UpdateWipLimitCommand request,
        CancellationToken ct)
    {
        var project = await _db.Projects
            .FirstOrDefaultAsync(
                p => p.Id == request.ProjectId,
                ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        var isProjectManager = await _db.ProjectMembers
            .AnyAsync(pm =>
                pm.ProjectId == request.ProjectId &&
                pm.UserId == _currentUser.UserId &&
                pm.ProjectRole == ProjectRole.ProjectManager,
                ct);

        if (!_currentUser.IsAdmin && !isProjectManager)
            throw new UnauthorizedAccessException(
                "WIP limiti değiştirme yetkiniz yok.");

        if (request.WipLimit is not null && request.WipLimit < 0)
            throw new InvalidOperationException(
                "WIP limiti negatif olamaz.");

        var setting = await _db.BoardColumnSettings
            .FirstOrDefaultAsync(
                s => s.ProjectId == request.ProjectId &&
                     s.Status == request.Status,
                ct);

        if (setting is null)
        {
            _db.BoardColumnSettings.Add(new BoardColumnSetting
            {
                ProjectId = request.ProjectId,
                Status = request.Status,
                WipLimit = request.WipLimit,
            });
        }
        else
        {
            setting.WipLimit = request.WipLimit;
        }

        await _db.SaveChangesAsync(ct);
    }
}