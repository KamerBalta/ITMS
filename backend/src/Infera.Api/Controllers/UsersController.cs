using Infera.Application.Features.ProjectMembers.GetUserProjects;
using Infera.Application.Features.Users.CreateUser;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    public UsersController(IMediator mediator) => _mediator = mediator;

    [HttpGet("{userId}/projects")]
    public async Task<IActionResult> GetUserProjects(Guid userId)
    {
        var result = await _mediator.Send(new GetUserProjectsQuery(userId));
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Create(CreateUserRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateUserCommand(request.Name, request.Email, request.Password, request.Title));
            return CreatedAtAction(nameof(GetUserProjects), new { userId = id }, new { id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}

public record CreateUserRequest(string Name, string Email, string Password, string? Title);