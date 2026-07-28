using Infera.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Infera.Infrastructure.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;
    public CurrentUserService(IHttpContextAccessor accessor) => _accessor = accessor;

    public Guid UserId
    {
        get
        {
            var value = _accessor.HttpContext?.User?.FindFirstValue("sub");
            return value is null ? Guid.Empty : Guid.Parse(value);
        }
    }

    public bool IsAdmin => _accessor.HttpContext?.User?.IsInRole("System Admin") ?? false;

    public IReadOnlyList<string> Roles =>
        _accessor.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? new List<string>();
}