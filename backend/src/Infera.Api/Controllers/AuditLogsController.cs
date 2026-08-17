using Infera.Application.Features.AuditLogs.GetTaskAuditHistory;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuditLogsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("tasks/{taskId}")]
    public async Task<IActionResult> GetTaskHistory(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(
                new GetTaskAuditHistoryQuery(taskId));

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }
}