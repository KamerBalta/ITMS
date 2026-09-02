using AuditLogEntity = Infera.Domain.Entities.AuditLog;
using Infera.Application.Common.Interfaces;
using System.Security.Claims;

namespace Infera.Api.Middleware;

public class AuditLogMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly HashSet<string> MutatingMethods = new() { "POST", "PUT", "DELETE", "PATCH" };

    public AuditLogMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, IAppDbContext db)
    {
        await _next(context);

        // Sadece degistiren istekleri, sadece giris yapmis kullanicilar icin,
        // sadece basarili (2xx) sonuclarda logla.
        if (!MutatingMethods.Contains(context.Request.Method))
            return;

        if (context.Response.StatusCode < 200 || context.Response.StatusCode >= 300)
            return;

        var userIdClaim = context.User?.FindFirstValue("sub");
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return;

        try
        {
            db.AuditLogs.Add(new AuditLogEntity
            {
                UserId = userId,
                EntityType = "HttpRequest",
                EntityId = Guid.Empty,
                Action = $"{context.Request.Method} {context.Request.Path}",
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.Request.Headers.UserAgent.ToString(),
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }
        catch
        {
            // Audit log yazimi asla ana istegi bozmamali.
        }
    }
}