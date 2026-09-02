using Infera.Application.Common.Interfaces;
using Infera.Application.Common.Services;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Sprints.CreateSprint;

public class CreateSprintCommandHandler : IRequestHandler<CreateSprintCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly INotificationService _notificationService;
    private readonly IRealtimeNotifier _realtime;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectPermissionService _permissionService;

    public CreateSprintCommandHandler(
        IAppDbContext db,
        IProjectAccessService access,
        INotificationService notificationService,
        IRealtimeNotifier realtime,
        ICurrentUserService currentUser,
        IProjectPermissionService permissionService)
    {
        _db = db;
        _access = access;
        _notificationService = notificationService;
        _realtime = realtime;
        _currentUser = currentUser;
        _permissionService = permissionService;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateSprintCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projede sprint oluşturma yetkiniz yok.");

        var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");
        if (!isPrivileged)
        {
            var developerCanManage = await _permissionService.IsOverrideEnabledAsync(request.ProjectId, "DeveloperCanManageSprints", ct);
            if (!developerCanManage)
                throw new UnauthorizedAccessException("Sprint oluşturma yetkiniz yok.");
        }

        if (request.EndDate <= request.StartDate)
            throw new InvalidOperationException("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");

        var sprint = new Sprint
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Goal = request.Goal,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = SprintStatus.Active
        };

        _db.Sprints.Add(sprint);
        await _db.SaveChangesAsync(ct);

        // BR-014: Sprint baslangic bildirimi -- projenin tum uyelerine
        var memberIds = await _db.ProjectMembers
            .Where(m => m.ProjectId == request.ProjectId)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync(ct);

        foreach (var userId in memberIds)
        {
            await _notificationService.NotifyAsync(
                userId,
                "Yeni Sprint başladı",
                $"\"{sprint.Name}\" sprinti {project.Name} projesinde başladı.",
                NotificationType.Sprint,
                $"/sprints/{sprint.Id}",
                ct: ct);
        }

        await _realtime.NotifyProjectAsync(request.ProjectId, "sprint", "created", ct);

        return sprint.Id;
    }
}