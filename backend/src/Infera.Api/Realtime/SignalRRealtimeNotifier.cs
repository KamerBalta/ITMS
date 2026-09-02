using Infera.Api.Hubs;
using Infera.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Infera.Api.Realtime;

public class SignalRRealtimeNotifier : IRealtimeNotifier
{
    private readonly IHubContext<ProjectHub> _hubContext;
    public SignalRRealtimeNotifier(IHubContext<ProjectHub> hubContext) => _hubContext = hubContext;

    public async System.Threading.Tasks.Task NotifyProjectAsync(Guid projectId, string entityType, string action, CancellationToken ct = default)
    {
        await _hubContext.Clients.Group($"project-{projectId}").SendAsync(
            "ProjectUpdated", new { entityType, action, timestamp = DateTime.UtcNow }, ct);
    }
}