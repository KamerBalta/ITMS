using Infera.Application.Features.Roadmap;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/roadmap")]
[Authorize]
public class RoadmapController : ControllerBase
{
    private readonly IMediator _mediator;
    public RoadmapController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Get(Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetRoadmapQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}