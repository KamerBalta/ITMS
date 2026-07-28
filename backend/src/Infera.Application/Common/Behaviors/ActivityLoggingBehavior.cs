using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using System.Reflection;

namespace Infera.Application.Common.Behaviors;

public class ActivityLoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ActivityLoggingBehavior(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var response = await next();

        var requestName = typeof(TRequest).Name;

        // Sadece Command'lari logla, Query'leri degil (convention: isim "Command" ile bitiyor)
        if (!requestName.EndsWith("Command"))
            return response;

        // Anonim (login/forgot-password gibi) komutlarda kullanici yok -- atla
        if (_currentUser.UserId == Guid.Empty)
            return response;

        try
        {
            var entityType = ExtractEntityType(typeof(TRequest));
            var entityId = ExtractEntityId(request, response, entityType);

            _db.ActivityLogs.Add(new ActivityLog
            {
                UserId = _currentUser.UserId,
                Action = requestName.Replace("Command", ""),
                EntityType = entityType,
                EntityId = entityId
            });

            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            // Activity log da audit log gibi ikincil -- ana islemi bozmasin.
        }

        return response;
    }

    // Convention: Infera.Application.Features.{EntityType}.{FeatureName}.{Command}
    // -- ornegin Infera.Application.Features.Tasks.CreateTask.CreateTaskCommand -> "Tasks"
    private static string ExtractEntityType(Type requestType)
    {
        var ns = requestType.Namespace ?? "";
        var parts = ns.Split('.');
        var featuresIndex = Array.IndexOf(parts, "Features");
        return featuresIndex >= 0 && featuresIndex + 1 < parts.Length ? parts[featuresIndex + 1] : "Unknown";
    }

    private static Guid ExtractEntityId(TRequest request, TResponse response, string entityType)
    {
        // 1) Create komutlari genelde Guid doner -- onu kullan
        if (response is Guid guidResponse)
            return guidResponse;

        // 2) Tekil entity adiyla eslesen bir property ara (orn. "Tasks" -> "TaskId")
        var singular = entityType.EndsWith("s") ? entityType[..^1] : entityType;
        var idPropName = $"{singular}Id";

        var prop = typeof(TRequest).GetProperty(idPropName, BindingFlags.Public | BindingFlags.Instance);
        if (prop?.GetValue(request) is Guid idFromNamedProp)
            return idFromNamedProp;

        // 3) Bulunamadiysa, ilk Guid property'yi kullan (fallback)
        var anyGuidProp = typeof(TRequest).GetProperties()
            .FirstOrDefault(p => p.PropertyType == typeof(Guid));
        if (anyGuidProp?.GetValue(request) is Guid fallbackGuid)
            return fallbackGuid;

        return Guid.Empty;
    }
}