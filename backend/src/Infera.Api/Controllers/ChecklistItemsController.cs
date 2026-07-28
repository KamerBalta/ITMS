using Infera.Application.Features.ChecklistItems.AddChecklistItem;
using Infera.Application.Features.ChecklistItems.DeleteChecklistItem;
using Infera.Application.Features.ChecklistItems.GetChecklistItems;
using Infera.Application.Features.ChecklistItems.ToggleChecklistItem;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks/{taskId}/checklist")]
[Authorize]
public class ChecklistItemsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChecklistItemsController(IMediator mediator) => _mediator = mediator;


    [HttpGet]
    public async Task<IActionResult> GetAll(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(
                new GetChecklistItemsQuery(taskId));

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }


    [HttpPost]
    public async Task<IActionResult> Add(
        Guid taskId,
        AddChecklistItemRequest request)
    {
        try
        {
            var id = await _mediator.Send(
                new AddChecklistItemCommand(
                    taskId,
                    request.ItemText));

            return CreatedAtAction(
                nameof(GetAll),
                new { taskId },
                new { id });
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


    [HttpPut("{itemId}/toggle")]
    public async Task<IActionResult> Toggle(
        Guid taskId,
        Guid itemId)
    {
        try
        {
            await _mediator.Send(
                new ToggleChecklistItemCommand(itemId));

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


    [HttpDelete("{itemId}")]
    public async Task<IActionResult> Delete(
        Guid taskId,
        Guid itemId)
    {
        try
        {
            await _mediator.Send(
                new DeleteChecklistItemCommand(itemId));

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


public record AddChecklistItemRequest(string ItemText);