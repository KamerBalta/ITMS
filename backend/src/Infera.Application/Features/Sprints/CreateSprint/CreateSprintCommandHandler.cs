using Infera.Application.Common.Interfaces;
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

    public CreateSprintCommandHandler(
        IAppDbContext db,
        IProjectAccessService access,
        INotificationService notificationService,
        IRealtimeNotifier realtime)
    {
        _db = db;
        _access = access;
        _notificationService = notificationService;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateSprintCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projede sprint oluşturma yetkiniz yok.");

        if (request.EndDate <= request.StartDate)
            throw new InvalidOperationException("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");

        var sprint = new Sprint
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Goal = request.Goal,
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
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
                ct);
        }

        await _realtime.NotifyProjectAsync(request.ProjectId, "sprint", "created", ct);

        return sprint.Id;
    }
}