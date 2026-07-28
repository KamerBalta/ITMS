using Infera.Domain.Enums;

namespace Infera.Application.Common.Interfaces;

public interface ITaskStatusTransitionService
{
    // Gecis izinli mi -- degilse mesajla birlikte false doner
    (bool Allowed, string? ErrorMessage) CanTransition(ItemStatus from, ItemStatus to, IReadOnlyList<string> roles, bool isAdmin);
}