using Infera.Application.Features.Backlog.GetBacklog;
using Infera.Application.Features.Backlog.RemoveFromSprint;
using Infera.Application.Features.Backlog.ReorderBacklog;
using Infera.Application.Features.Tasks.MoveToSprint;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/backlog")]
[Authorize]
public class BacklogController : ControllerBase
{
    private readonly IMediator _mediator;

    public BacklogController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetBacklogQuery query)
    {
        try
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
       StatusCodes.Status403Forbidden,
       new { message = ex.Message });
        }
    }

    [HttpPut("reorder")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Reorder(ReorderBacklogCommand command)
    {
        try
        {
            await _mediator.Send(command);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/move-to-sprint")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> MoveToSprint(Guid taskId, MoveToSprintRequest request)
    {
        try
        {
            await _mediator.Send(new MoveToSprintCommand(taskId, request.SprintId));
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
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
       StatusCodes.Status403Forbidden,
       new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/remove-from-sprint")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> RemoveFromSprint(Guid taskId)
    {
        try
        {
            await _mediator.Send(new RemoveFromSprintCommand(taskId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
       StatusCodes.Status403Forbidden,
       new { message = ex.Message });
        }
    }
}