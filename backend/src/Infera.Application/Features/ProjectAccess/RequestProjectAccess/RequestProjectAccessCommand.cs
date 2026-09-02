using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ProjectAccess.RequestProjectAccess;

public record RequestProjectAccessCommand(Guid ProjectId, string? Message) : IRequest;

public class RequestProjectAccessCommandHandler : IRequestHandler<RequestProjectAccessCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;

    public RequestProjectAccessCommandHandler(IAppDbContext db, ICurrentUserService currentUser, INotificationService notificationService)
    {
        _db = db; _currentUser = currentUser; _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task Handle(RequestProjectAccessCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        var alreadyMember = await _db.ProjectMembers.AnyAsync(m => m.ProjectId == request.ProjectId && m.UserId == _currentUser.UserId, ct);
        if (alreadyMember) throw new InvalidOperationException("Zaten bu projenin üyesisiniz.");

        var requester = await _db.Users.FirstAsync(u => u.Id == _currentUser.UserId, ct);

        // #B: Jira'nin cozemedigi sorun -- "erisimin olmayan bir projeyi gorunce platform
        // disina e-posta atmak gerekiyor". Burada dogrudan uygulama ici bir bildirim akisi.
        await _notificationService.NotifyAsync(
            project.OwnerId, "Proje erişim talebi",
            $"{requester.Name}, \"{project.Name}\" projesine erişim talep ediyor." + (string.IsNullOrWhiteSpace(request.Message) ? "" : $" Not: {request.Message}"),
            NotificationType.Task, $"/projects/{project.Id}", isImportant: true, ct: ct);
    }
}