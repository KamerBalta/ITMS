using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;

namespace Infera.Application.Common.Services;

public class TaskStatusTransitionService : ITaskStatusTransitionService
{
    private static readonly Dictionary<string, (ItemStatus From, ItemStatus To)[]> RoleTransitions = new()
    {
        ["Developer"] = new[]
        {
            (ItemStatus.ToDo, ItemStatus.InProgress),
            (ItemStatus.InProgress, ItemStatus.ReadyForReview),
        },

        ["QA"] = new[]
        {
            (ItemStatus.ReadyForQA, ItemStatus.Done),
            (ItemStatus.ReadyForQA, ItemStatus.InProgress),
        },

        ["Tester"] = new[]
        {
            (ItemStatus.ReadyForQA, ItemStatus.Done),
            (ItemStatus.ReadyForQA, ItemStatus.InProgress),
        }
    };


    public (bool Allowed, string? ErrorMessage) CanTransition(
        ItemStatus from,
        ItemStatus to,
        IReadOnlyList<string> roles,
        bool isAdmin)
    {
        if (from == to)
        {
            return (false, "Görev zaten bu durumda.");
        }


        // Admin ve Project Manager tüm geçişleri yapabilir.
        if (isAdmin || roles.Contains(nameof(ProjectRole.ProjectManager)))
        {
            return (true, null);
        }


        // BR-016
        // ReadyForReview -> ReadyForQA sadece PM/Admin
        if (from == ItemStatus.ReadyForReview &&
            to == ItemStatus.ReadyForQA)
        {
            return (false,
                "Bu geçişi yalnızca Project Manager onaylayabilir.");
        }


        foreach (var role in roles)
        {
            if (RoleTransitions.TryGetValue(role, out var transitions))
            {
                var allowed = transitions.Any(x =>
                    x.From == from &&
                    x.To == to);

                if (allowed)
                {
                    return (true, null);
                }
            }
        }


        return (
            false,
            $"'{string.Join(",", roles)}' rolü için {from} → {to} geçişine izin verilmiyor."
        );
    }
}