using Infera.Application.Features.Workflow;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}")]
[Authorize]
public class WorkflowController : ControllerBase
{
    private readonly IMediator _mediator;
    public WorkflowController(IMediator mediator) => _mediator = mediator;

    // --- Statuses ---
    [HttpGet("workflow-statuses")]
    public async Task<IActionResult> GetStatuses(Guid projectId, [FromQuery] bool includeDraft = false)
    {
        try { return Ok(await _mediator.Send(new GetWorkflowStatusesQuery(projectId, includeDraft))); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost("workflow-statuses")]
    public async Task<IActionResult> CreateStatus(Guid projectId, WorkflowStatusRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateWorkflowStatusCommand(projectId, request.Name, request.Category, request.Color));
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("workflow-statuses/{statusId}")]
    public async Task<IActionResult> UpdateStatus(Guid projectId, Guid statusId, WorkflowStatusRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateWorkflowStatusCommand(statusId, request.Name, request.Category, request.Color));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("workflow-statuses/{statusId}")]
    public async Task<IActionResult> DeleteStatus(Guid projectId, Guid statusId)
    {
        try
        {
            await _mediator.Send(new DeleteWorkflowStatusCommand(statusId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("workflow-statuses/reorder")]
    public async Task<IActionResult> ReorderStatuses(Guid projectId, ReorderStatusesRequest request)
    {
        try
        {
            await _mediator.Send(new ReorderWorkflowStatusesCommand(projectId, request.OrderedIds));
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("workflow-statuses/{statusId}/set-initial")]
    public async Task<IActionResult> SetInitial(Guid projectId, Guid statusId)
    {
        try { await _mediator.Send(new SetInitialStatusCommand(projectId, statusId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("workflow-statuses/{statusId}/set-epic-close-target")]
    public async Task<IActionResult> SetEpicCloseTarget(Guid projectId, Guid statusId)
    {
        try { await _mediator.Send(new SetEpicCloseTargetCommand(projectId, statusId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    // --- Transitions ---
    [HttpGet("workflow")]
    public async Task<IActionResult> GetTransitions(Guid projectId, [FromQuery] bool includeDraft = false)
    {
        try { return Ok(await _mediator.Send(new GetWorkflowTransitionsQuery(projectId, includeDraft))); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost("workflow")]
    public async Task<IActionResult> CreateTransition(Guid projectId, WorkflowTransitionRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateWorkflowTransitionCommand(projectId, request.FromStatusId, request.ToStatusId, request.AllowedRoles, request.RequireAssigneeSelf));
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("workflow/{transitionId}")]
    public async Task<IActionResult> UpdateTransition(Guid projectId, Guid transitionId, UpdateWorkflowTransitionRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateWorkflowTransitionCommand(transitionId, request.AllowedRoles, request.RequireAssigneeSelf));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("workflow/{transitionId}")]
    public async Task<IActionResult> DeleteTransition(Guid projectId, Guid transitionId)
    {
        try
        {
            await _mediator.Send(new DeleteWorkflowTransitionCommand(transitionId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost("workflow/publish")]
    public async Task<IActionResult> Publish(Guid projectId)
    {
        try
        {
            await _mediator.Send(new PublishWorkflowCommand(projectId));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("workflow/has-unpublished-changes")]
    public async Task<IActionResult> HasUnpublishedChanges(Guid projectId)
    {
        return Ok(new { hasChanges = await _mediator.Send(new HasUnpublishedChangesQuery(projectId)) });
    }
}

public record WorkflowStatusRequest(string Name, string Category, string? Color);
public record ReorderStatusesRequest(List<Guid> OrderedIds);
public record WorkflowTransitionRequest(Guid FromStatusId, Guid ToStatusId, List<string> AllowedRoles, bool RequireAssigneeSelf);
public record UpdateWorkflowTransitionRequest(List<string> AllowedRoles, bool RequireAssigneeSelf);