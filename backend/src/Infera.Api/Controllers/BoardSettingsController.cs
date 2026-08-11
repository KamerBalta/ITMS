using Infera.Application.Features.BoardSettings;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/board-settings")]
[Authorize]
public class BoardSettingsController : ControllerBase
{
    private readonly IMediator _mediator;
    public BoardSettingsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetBoardColumnSettingsQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) {
            return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message });
        }
    }

    [HttpPut("{status}/wip-limit")]
    public async Task<IActionResult> UpdateWipLimit(Guid projectId, string status, UpdateWipLimitRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateWipLimitCommand(projectId, status, request.WipLimit));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) {
            return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message }); }
    }
}

public record UpdateWipLimitRequest(int? WipLimit);