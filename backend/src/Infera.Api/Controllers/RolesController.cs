using Infera.Application.Features.Roles.GetRoles;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IMediator _mediator;
    public RolesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetRolesQuery());
        return Ok(result);
    }
}