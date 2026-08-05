using Infera.Application.Features.Export.ExportAuditLogs;
using Infera.Application.Features.Export.ExportBacklog;
using Infera.Application.Features.Export.ExportSprintReport;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IMediator _mediator;

    public ExportController(IMediator mediator) => _mediator = mediator;


    private const string ExcelContentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";


    [HttpGet("reports/export/sprint/{sprintId}")]
    public async Task<IActionResult> ExportSprint(Guid sprintId)
    {
        try
        {
            var bytes = await _mediator.Send(
                new ExportSprintReportQuery(sprintId));

            return File(
                bytes,
                ExcelContentType,
                $"sprint-raporu-{sprintId}.xlsx");
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


    [HttpGet("reports/export/backlog/{projectId}")]
    public async Task<IActionResult> ExportBacklog(Guid projectId)
    {
        try
        {
            var bytes = await _mediator.Send(
                new ExportBacklogQuery(projectId));

            return File(
                bytes,
                ExcelContentType,
                $"backlog-{projectId}.xlsx");
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


    [HttpGet("audit-logs/export")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> ExportAuditLogs()
    {
        var bytes = await _mediator.Send(
            new ExportAuditLogsQuery());

        return File(
            bytes,
            ExcelContentType,
            "audit-loglari.xlsx");
    }
}