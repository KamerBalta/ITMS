using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Infera.Application.Common.Services;
using Infera.Domain.Enums;

namespace Infera.Application.Features.Tasks.UpdateTaskField;

// Ortak yetki kontrolleri -- matris burada kodlanmis durumda
file static class TaskFieldAuthorization
{
    public static bool IsPMOrAdmin(ICurrentUserService u) =>
        u.IsAdmin || u.Roles.Contains("Project Manager");

    public static bool IsAssigneeDeveloperOrQA(ICurrentUserService u, Guid? assigneeId) =>
        assigneeId == u.UserId && (u.Roles.Contains("Developer") || u.Roles.Contains("QA/Tester"));

    public static bool IsAssigneeDeveloperOnly(ICurrentUserService u, Guid? assigneeId) =>
        assigneeId == u.UserId && u.Roles.Contains("Developer");
}

// Baslik: yalnizca PM/Admin
public class UpdateTaskTitleCommandHandler : IRequestHandler<UpdateTaskTitleCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public UpdateTaskTitleCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(UpdateTaskTitleCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!TaskFieldAuthorization.IsPMOrAdmin(_currentUser))
            throw new UnauthorizedAccessException("Başlık değiştirme yetkiniz yok. Yalnızca Project Manager/Admin değiştirebilir.");

        task.Title = request.Title;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}


// Aciklama: PM/Admin her zaman, Developer/QA yalnizca kendi gorevindeyse
public class UpdateTaskDescriptionCommandHandler : IRequestHandler<UpdateTaskDescriptionCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;

    public UpdateTaskDescriptionCommandHandler(IAppDbContext db, ICurrentUserService currentUser, INotificationService notificationService)
    {
        _db = db;
        _currentUser = currentUser;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task Handle(UpdateTaskDescriptionCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        var allowed = TaskFieldAuthorization.IsPMOrAdmin(_currentUser)
            || TaskFieldAuthorization.IsAssigneeDeveloperOrQA(_currentUser, task.AssigneeId);

        if (!allowed)
            throw new UnauthorizedAccessException("Açıklama değiştirme yetkiniz yok.");

        // #2: Aciklamadaki mention'lari, YALNIZCA yeni eklenenler icin bildir (yorumdaki UpdateComment ile ayni mantik)
        var previousMentions = MentionParser.ExtractMentionedUserIds(task.Description);

        task.Description = request.Description;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var newMentions = MentionParser.ExtractMentionedUserIds(request.Description)
            .Where(id => id != _currentUser.UserId && !previousMentions.Contains(id));

        foreach (var userId in newMentions)
        {
            await _notificationService.NotifyAsync(
                userId, "Görev açıklamasında bahsedildiniz",
                $"\"{task.Title}\" görevinin açıklamasında sizden bahsedildi.",
                NotificationType.Mention, $"/tasks/{task.Id}", ct);
        }
    }
}

// Oncelik: yalnizca PM/Admin
public class UpdateTaskPriorityCommandHandler : IRequestHandler<UpdateTaskPriorityCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public UpdateTaskPriorityCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(UpdateTaskPriorityCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!TaskFieldAuthorization.IsPMOrAdmin(_currentUser))
            throw new UnauthorizedAccessException("Öncelik değiştirme yetkiniz yok.");

        task.Priority = request.Priority;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

// Story Point: PM/Admin her zaman, YALNIZCA Developer kendi gorevindeyse (QA hic yapamaz)
public class UpdateTaskStoryPointCommandHandler : IRequestHandler<UpdateTaskStoryPointCommand>
{
    private static readonly int[] ValidStoryPoints = { 1, 2, 3, 5, 8, 13, 21 };
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public UpdateTaskStoryPointCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(UpdateTaskStoryPointCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        var allowed = TaskFieldAuthorization.IsPMOrAdmin(_currentUser)
            || TaskFieldAuthorization.IsAssigneeDeveloperOnly(_currentUser, task.AssigneeId);

        if (!allowed)
            throw new UnauthorizedAccessException("Story Point değiştirme yetkiniz yok.");

        if (request.StoryPoint is not null && !ValidStoryPoints.Contains(request.StoryPoint.Value))
            throw new InvalidOperationException("Story Point yalnızca 1, 2, 3, 5, 8, 13 veya 21 olabilir.");

        task.StoryPoint = request.StoryPoint;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

// Teslim Tarihi: yalnizca PM/Admin
public class UpdateTaskDueDateCommandHandler : IRequestHandler<UpdateTaskDueDateCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public UpdateTaskDueDateCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(UpdateTaskDueDateCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!TaskFieldAuthorization.IsPMOrAdmin(_currentUser))
            throw new UnauthorizedAccessException("Teslim tarihi değiştirme yetkiniz yok.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (request.DueDate is not null && request.DueDate.Value < today)
        {
            throw new InvalidOperationException("Teslim tarihi geçmiş bir tarih olamaz.");
        }

        task.DueDate = request.DueDate;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
// Release baglama: yalnizca PM/Admin (release yonetimi zaten PM-only bir alan)
public class UpdateTaskReleaseCommandHandler : IRequestHandler<UpdateTaskReleaseCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public UpdateTaskReleaseCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(UpdateTaskReleaseCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!TaskFieldAuthorization.IsPMOrAdmin(_currentUser))
            throw new UnauthorizedAccessException("Release bağlama yetkiniz yok.");

        if (request.ReleaseId is not null)
        {
            var releaseValid = await _db.Releases
                .AnyAsync(r => r.Id == request.ReleaseId && r.ProjectId == task.ProjectId, ct);
            if (!releaseValid)
                throw new InvalidOperationException("Belirtilen release bu projeye ait değil.");
        }

        task.ReleaseId = request.ReleaseId;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}