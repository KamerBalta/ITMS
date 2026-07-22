using Infera.Application.Features.Sprints.CompleteSprint;
using Infera.Application.Features.Sprints.CreateSprint;
using Infera.Application.Features.Sprints.GetSprints;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/sprints")]
[Authorize]
public class SprintsController : ControllerBase
{
    private readonly IMediator _mediator;
    public SprintsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid projectId)
    {
        var result = await _mediator.Send(new GetSprintsQuery(projectId));
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Create(CreateSprintRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateSprintCommand(
                request.ProjectId, request.Name, request.Goal, request.StartDate, request.EndDate));
            return CreatedAtAction(nameof(GetAll), new { projectId = request.ProjectId }, new { id });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{sprintId}/complete")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Complete(Guid sprintId)
    {
        try
        {
            await _mediator.Send(new CompleteSprintCommand(sprintId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public record CreateSprintRequest(Guid ProjectId, string Name, string? Goal, DateTime StartDate, DateTime EndDate);