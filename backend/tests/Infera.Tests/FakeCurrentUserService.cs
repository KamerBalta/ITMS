using Infera.Application.Common.Interfaces;

namespace Infera.Tests;

public class FakeCurrentUserService : ICurrentUserService
{
    public Guid UserId { get; set; } = Guid.NewGuid();
    public bool IsAdmin { get; set; }
    public IReadOnlyList<string> Roles { get; set; } = new List<string>();
}