using Infera.Application.Features.Labels.CreateLabel;
using Infera.Application.Features.Labels.DeleteLabel;
using Infera.Application.Features.Labels.GetLabels;
using Infera.Application.Features.Labels.UpdateLabel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/labels")]
[Authorize]
public class LabelsController : ControllerBase
{
    private readonly IMediator _mediator;
    public LabelsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetLabelsQuery());
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateLabelRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateLabelCommand(request.Name, request.Color));
            return CreatedAtAction(nameof(GetAll), new { id }, new { id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{labelId}")]
    public async Task<IActionResult> Update(Guid labelId, UpdateLabelRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateLabelCommand(labelId, request.Name, request.Color));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{labelId}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(Guid labelId)
    {
        try
        {
            await _mediator.Send(new DeleteLabelCommand(labelId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public record CreateLabelRequest(string Name, string? Color);
public record UpdateLabelRequest(string Name, string? Color);