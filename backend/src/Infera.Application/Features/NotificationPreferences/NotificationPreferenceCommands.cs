using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.NotificationPreferences;

public record GetMyNotificationPreferencesQuery(Guid UserId) : IRequest<List<NotificationPreferenceDto>>;
public record UpdateNotificationPreferenceCommand(Guid UserId, string NotificationType, bool InAppEnabled, bool EmailEnabled) : IRequest;

public record NotificationPreferenceDto(string NotificationType, bool InAppEnabled, bool EmailEnabled);

public class GetMyNotificationPreferencesQueryHandler : IRequestHandler<GetMyNotificationPreferencesQuery, List<NotificationPreferenceDto>>
{
    private static readonly string[] AllTypes = { "Task", "Sprint", "Mention", "Release" };
    private readonly IAppDbContext _db;
    public GetMyNotificationPreferencesQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<NotificationPreferenceDto>> Handle(GetMyNotificationPreferencesQuery request, CancellationToken ct)
    {
        var existing = await _db.NotificationPreferences
            .Where(p => p.UserId == request.UserId)
            .ToDictionaryAsync(p => p.NotificationType, ct);

        return AllTypes
            .Select(t => existing.TryGetValue(t, out var pref)
                ? new NotificationPreferenceDto(t, pref.InAppEnabled, pref.EmailEnabled)
                : new NotificationPreferenceDto(t, true, true)) // varsayilan: ikisi de acik
            .ToList();
    }
}

public class UpdateNotificationPreferenceCommandHandler : IRequestHandler<UpdateNotificationPreferenceCommand>
{
    private readonly IAppDbContext _db;
    public UpdateNotificationPreferenceCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(UpdateNotificationPreferenceCommand request, CancellationToken ct)
    {
        var pref = await _db.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == request.UserId && p.NotificationType == request.NotificationType, ct);

        if (pref is null)
        {
            _db.NotificationPreferences.Add(new NotificationPreference
            {
                UserId = request.UserId,
                NotificationType = request.NotificationType,
                InAppEnabled = request.InAppEnabled,
                EmailEnabled = request.EmailEnabled,
            });
        }
        else
        {
            pref.InAppEnabled = request.InAppEnabled;
            pref.EmailEnabled = request.EmailEnabled;
        }

        await _db.SaveChangesAsync(ct);
    }
}