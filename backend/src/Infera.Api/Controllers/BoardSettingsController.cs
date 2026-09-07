using Infera.Application.Features.BoardSettings;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/boards/{boardId}/settings")]
[Authorize]
public class BoardSettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public BoardSettingsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid boardId)
    {
        try
        {
            return Ok(await _mediator.Send(new GetBoardColumnSettingsQuery(boardId)));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPut("{columnId}/wip-limit")]
    public async Task<IActionResult> UpdateWipLimit(Guid boardId, Guid columnId, UpdateWipLimitRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateWipLimitCommand(boardId, columnId, request.WipLimit));
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}

public record UpdateWipLimitRequest(int? WipLimit);