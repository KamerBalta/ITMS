using Infera.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Services;

public class TaskStatusTransitionService : ITaskStatusTransitionService
{
    private readonly IAppDbContext _db;
    public TaskStatusTransitionService(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<(bool Allowed, string? ErrorMessage)> CanTransitionAsync(
        Guid projectId, Guid fromStatusId, Guid toStatusId, IReadOnlyList<string> roles, bool isAdmin, bool isAssignee,
        CancellationToken ct = default)
    {
        if (fromStatusId == toStatusId)
            return (false, "Görev zaten bu durumda.");

        if (isAdmin)
            return (true, null);

        // #Madde-4: yalnizca YAYINLANMIS (IsDraft=false) gecisler gecerlidir.
        var transition = await _db.WorkflowTransitions
            .FirstOrDefaultAsync(t =>
                t.ProjectId == projectId &&
                t.FromStatusId == fromStatusId &&
                t.ToStatusId == toStatusId &&
                !t.IsDraft, ct);

        Console.WriteLine("========== WORKFLOW DEBUG ==========");
        Console.WriteLine($"ProjectId: {projectId}");
        Console.WriteLine($"FromStatusId: {fromStatusId}");
        Console.WriteLine($"ToStatusId: {toStatusId}");
        Console.WriteLine($"Transition found: {transition != null}");

        if (transition != null)
        {
            Console.WriteLine($"AllowedRoles: {transition.AllowedRoles}");
            Console.WriteLine($"RequireAssigneeSelf: {transition.RequireAssigneeSelf}");
        }

        Console.WriteLine($"User roles: {string.Join(", ", roles)}");
        Console.WriteLine($"IsAdmin: {isAdmin}");
        Console.WriteLine($"IsAssignee: {isAssignee}");
        Console.WriteLine("====================================");

        if (transition is null)
            return (false, "Bu proje için bu geçiş tanımlanmamış veya henüz yayınlanmamış.");

        var allowedRoles = transition.AllowedRoles
      .Split(',', StringSplitOptions.TrimEntries);

        Console.WriteLine("=== WORKFLOW TRANSITION DEBUG ===");
        Console.WriteLine($"From: {fromStatusId}");
        Console.WriteLine($"To: {toStatusId}");
        Console.WriteLine($"User roles: {string.Join(", ", roles)}");
        Console.WriteLine($"Allowed roles: {string.Join(", ", allowedRoles)}");
        Console.WriteLine($"Is admin: {isAdmin}");
        Console.WriteLine($"Is assignee: {isAssignee}");

        var hasRole = roles.Any(r => allowedRoles.Contains(r));

        Console.WriteLine($"Has role: {hasRole}");

        if (!hasRole)
            return (false, $"Bu geçiş için yetkiniz yok. Gerekli rol(ler): {transition.AllowedRoles}");

        if (transition.RequireAssigneeSelf && !isAssignee)
            return (false, "Bu geçişi yalnızca görevin atandığı kişi (ya da Project Manager) yapabilir.");

        return (true, null);
    }
}