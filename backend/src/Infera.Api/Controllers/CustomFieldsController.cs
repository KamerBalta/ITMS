using Infera.Application.Features.CustomFields;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class CustomFieldsController : ControllerBase
{
    private readonly IMediator _mediator;
    public CustomFieldsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("projects/{projectId}/custom-fields")]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetCustomFieldsQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost("projects/{projectId}/custom-fields")]
    public async Task<IActionResult> Create(Guid projectId, CreateCustomFieldRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateCustomFieldCommand(projectId, request.Name, request.FieldType, request.OptionsJson, request.IsRequired));
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("projects/{projectId}/custom-fields/{fieldId}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid fieldId)
    {
        try
        {
            await _mediator.Send(new DeleteCustomFieldCommand(fieldId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpGet("tasks/{taskId}/custom-fields")]
    public async Task<IActionResult> GetTaskValues(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(new GetTaskCustomFieldValuesQuery(taskId));
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("tasks/{taskId}/custom-fields/{fieldId}")]
    public async Task<IActionResult> SetTaskValue(Guid taskId, Guid fieldId, SetCustomFieldValueRequest request)
    {
        try
        {
            await _mediator.Send(new SetTaskCustomFieldValueCommand(taskId, fieldId, request.Value));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record CreateCustomFieldRequest(string Name, string FieldType, string? OptionsJson, bool IsRequired);
public record SetCustomFieldValueRequest(string? Value);