using Infera.Application.Features.IssueTypes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/issue-types")]
[Authorize]
public class IssueTypesController : ControllerBase
{
    private readonly IMediator _mediator;
    public IssueTypesController(IMediator mediator) => _mediator = mediator;

    // Herkes gorebilir -- PM'in proje icin katalogdan secim yapabilmesi icin gerekli.
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var result = await _mediator.Send(new GetIssueTypesQuery(activeOnly));
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Create(IssueTypeRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateIssueTypeCommand(
                request.Name, request.Description, request.Icon, request.Color,
                request.CreatorTier, request.AllowsChildren, request.RequiresParent));
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Update(Guid id, IssueTypeRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateIssueTypeCommand(
                id, request.Name, request.Description, request.Icon, request.Color,
                request.CreatorTier, request.AllowsChildren, request.RequiresParent));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        try
        {
            await _mediator.Send(new ToggleIssueTypeActiveCommand(id));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _mediator.Send(new DeleteIssueTypeCommand(id));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}

public record IssueTypeRequest(
    string Name, string? Description, string? Icon, string? Color,
    int CreatorTier, bool AllowsChildren, bool RequiresParent);