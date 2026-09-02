using Infera.Application.Features.Components;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class ComponentsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ComponentsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("projects/{projectId}/components")]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetComponentsQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost("projects/{projectId}/components")]
    public async Task<IActionResult> Create(Guid projectId, ComponentRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateComponentCommand(projectId, request.Name, request.Description, request.LeadUserId));
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("projects/{projectId}/components/{componentId}")]
    public async Task<IActionResult> Update(Guid projectId, Guid componentId, ComponentRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateComponentCommand(componentId, request.Name, request.Description, request.LeadUserId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("projects/{projectId}/components/{componentId}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid componentId)
    {
        try
        {
            await _mediator.Send(new DeleteComponentCommand(componentId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost("tasks/{taskId}/components/{componentId}")]
    public async Task<IActionResult> AddToTask(Guid taskId, Guid componentId)
    {
        try
        {
            await _mediator.Send(new AddComponentToTaskCommand(taskId, componentId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("tasks/{taskId}/components/{componentId}")]
    public async Task<IActionResult> RemoveFromTask(Guid taskId, Guid componentId)
    {
        try
        {
            await _mediator.Send(new RemoveComponentFromTaskCommand(taskId, componentId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record ComponentRequest(string Name, string? Description, Guid? LeadUserId);