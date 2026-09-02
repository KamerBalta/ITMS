using Infera.Application.Features.Dashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/dashboard-widgets")]
[Authorize]
public class DashboardWidgetsController : ControllerBase
{
    private readonly IMediator _mediator;
    public DashboardWidgetsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        try { return Ok(await _mediator.Send(new GetMyDashboardWidgetsQuery(projectId))); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> Add(Guid projectId, AddWidgetRequest request)
    {
        try { return Ok(new { id = await _mediator.Send(new AddDashboardWidgetCommand(projectId, request.WidgetType, request.Title, request.Width)) }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("{widgetId}")]
    public async Task<IActionResult> Update(Guid projectId, Guid widgetId, UpdateWidgetRequest request)
    {
        try { await _mediator.Send(new UpdateDashboardWidgetCommand(widgetId, request.Title, request.Width)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("{widgetId}")]
    public async Task<IActionResult> Remove(Guid projectId, Guid widgetId)
    {
        try { await _mediator.Send(new RemoveDashboardWidgetCommand(widgetId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder(Guid projectId, ReorderWidgetsRequest request)
    {
        try { await _mediator.Send(new ReorderDashboardWidgetsCommand(projectId, request.OrderedIds)); return NoContent(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset(Guid projectId)
    {
        await _mediator.Send(new ResetDashboardWidgetsCommand(projectId));
        return NoContent();
    }
}

public record AddWidgetRequest(string WidgetType, string? Title, int Width);
public record UpdateWidgetRequest(string? Title, int Width);
public record ReorderWidgetsRequest(List<Guid> OrderedIds);