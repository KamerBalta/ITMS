using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Services;

public class TaskStatusTransitionService : ITaskStatusTransitionService
{
    private readonly IAppDbContext _db;
    public TaskStatusTransitionService(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<(bool Allowed, string? ErrorMessage)> CanTransitionAsync(
        Guid projectId, ItemStatus from, ItemStatus to, IReadOnlyList<string> roles, bool isAdmin, bool isAssignee,
        CancellationToken ct = default)
    {
        if (from == to)
            return (false, "Görev zaten bu durumda.");

        // Admin her zaman her geciste serbest -- workflow tanimindan bagimsiz, sistem geneli bir istisna.
        if (isAdmin)
            return (true, null);

        var transition = await _db.WorkflowTransitions
            .FirstOrDefaultAsync(t => t.ProjectId == projectId && t.FromStatus == from.ToString() && t.ToStatus == to.ToString(), ct);

        if (transition is null)
            return (false, $"Bu proje için {from} → {to} geçişi tanımlanmamış.");

        var allowedRoles = transition.AllowedRoles.Split(',', StringSplitOptions.TrimEntries);
        var hasRole = roles.Any(r => allowedRoles.Contains(r));

        if (!hasRole)
            return (false, $"Bu geçiş için yetkiniz yok. Gerekli rol(ler): {transition.AllowedRoles}");

        if (transition.RequireAssigneeSelf && !isAssignee)
            return (false, "Bu geçişi yalnızca görevin atandığı kişi (ya da Project Manager) yapabilir.");

        return (true, null);
    }
}