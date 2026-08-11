using Infera.Application.Features.ProjectIssueTypes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/issue-types")]
[Authorize]
public class ProjectIssueTypesController : ControllerBase
{
    private readonly IMediator _mediator;
    public ProjectIssueTypesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        var result = await _mediator.Send(new GetProjectIssueTypesQuery(projectId));
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Assign(Guid projectId, AssignIssueTypeRequest request)
    {
        try
        {
            var id = await _mediator.Send(new AssignIssueTypeToProjectCommand(projectId, request.IssueTypeId));
            return Ok(new { id });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { 
            return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message }); }
    }

    [HttpDelete("{issueTypeId}")]
    public async Task<IActionResult> Remove(Guid projectId, Guid issueTypeId)
    {
        try
        {
            await _mediator.Send(new RemoveIssueTypeFromProjectCommand(projectId, issueTypeId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message }); }
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder(Guid projectId, ReorderRequest request)
    {
        try
        {
            await _mediator.Send(new ReorderProjectIssueTypesCommand(projectId, request.OrderedIssueTypeIds));
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}

public record AssignIssueTypeRequest(Guid IssueTypeId);
public record ReorderRequest(List<Guid> OrderedIssueTypeIds);