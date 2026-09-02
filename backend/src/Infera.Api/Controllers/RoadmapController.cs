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
    [ProducesResponseType(typeof(RoadmapDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid projectId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetRoadmapQuery(projectId), ct);
        return Ok(result);
    }
}