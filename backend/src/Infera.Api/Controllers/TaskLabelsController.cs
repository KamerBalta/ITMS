using Infera.Application.Features.Labels.AddLabelToTask;
using Infera.Application.Features.Labels.RemoveLabelFromTask;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks/{taskId}/labels")]
[Authorize]
public class TaskLabelsController : ControllerBase
{
    private readonly IMediator _mediator;
    public TaskLabelsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("{labelId}")]
    public async Task<IActionResult> Add(Guid taskId, Guid labelId)
    {
        try
        {
            await _mediator.Send(new AddLabelToTaskCommand(taskId, labelId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{labelId}")]
    public async Task<IActionResult> Remove(Guid taskId, Guid labelId)
    {
        try
        {
            await _mediator.Send(new RemoveLabelFromTaskCommand(taskId, labelId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}