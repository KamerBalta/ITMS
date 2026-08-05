using Infera.Application.Features.WorkLogs.AddWorkLog;
using Infera.Application.Features.WorkLogs.DeleteWorkLog;
using Infera.Application.Features.WorkLogs.GetWorkLogs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks/{taskId}/worklogs")]
[Authorize]
public class WorkLogsController : ControllerBase
{
    private readonly IMediator _mediator;
    public WorkLogsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(new GetWorkLogsQuery(taskId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Add(Guid taskId, AddWorkLogRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            var id = await _mediator.Send(new AddWorkLogCommand(taskId, userId, request.TimeSpentMinutes, request.Description));
            return CreatedAtAction(nameof(GetAll), new { taskId }, new { id });
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

    [HttpDelete("{workLogId}")]
    public async Task<IActionResult> Delete(Guid taskId, Guid workLogId)
    {
        try
        {
            await _mediator.Send(new DeleteWorkLogCommand(workLogId));
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

public record AddWorkLogRequest(int TimeSpentMinutes, string? Description);