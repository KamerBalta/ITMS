using Infera.Application.Features.ProjectMembers.GetUserProjects;
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
}