namespace Infera.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid UserId { get; }
    bool IsAdmin { get; }
    IReadOnlyList<string> Roles { get; }
}