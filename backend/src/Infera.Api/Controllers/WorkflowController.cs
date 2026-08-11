using Infera.Application.Features.Workflow;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/workflow")]
[Authorize]
public class WorkflowController : ControllerBase
{
    private readonly IMediator _mediator;
    public WorkflowController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        var result = await _mediator.Send(new GetWorkflowTransitionsQuery(projectId));
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, WorkflowTransitionRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateWorkflowTransitionCommand(
                projectId, request.FromStatus, request.ToStatus, request.AllowedRoles, request.RequireAssigneeSelf));
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("{transitionId}")]
    public async Task<IActionResult> Update(Guid projectId, Guid transitionId, UpdateWorkflowTransitionRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateWorkflowTransitionCommand(transitionId, request.AllowedRoles, request.RequireAssigneeSelf));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    [HttpDelete("{transitionId}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid transitionId)
    {
        try
        {
            await _mediator.Send(new DeleteWorkflowTransitionCommand(transitionId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }
}

public record WorkflowTransitionRequest(string FromStatus, string ToStatus, List<string> AllowedRoles, bool RequireAssigneeSelf);
public record UpdateWorkflowTransitionRequest(List<string> AllowedRoles, bool RequireAssigneeSelf);