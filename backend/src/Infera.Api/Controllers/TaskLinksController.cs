using Infera.Application.Features.TaskLinks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks/{taskId}/links")]
[Authorize]
public class TaskLinksController : ControllerBase
{
    private readonly IMediator _mediator;
    public TaskLinksController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(new GetTaskLinksQuery(taskId));
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid taskId, CreateTaskLinkRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateTaskLinkCommand(taskId, request.TargetTaskId, request.LinkType));
            return Ok(new { id });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("{linkId}")]
    public async Task<IActionResult> Delete(Guid taskId, Guid linkId)
    {
        try
        {
            await _mediator.Send(new DeleteTaskLinkCommand(linkId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record CreateTaskLinkRequest(Guid TargetTaskId, string LinkType);