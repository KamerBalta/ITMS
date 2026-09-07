using Infera.Application.Features.Boards;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/boards")]
[Authorize]
public class BoardsController : ControllerBase
{
    private readonly IMediator _mediator;
    public BoardsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        try { return Ok(await _mediator.Send(new GetBoardsQuery(projectId))); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, CreateBoardRequest request)
    {
        try { return Ok(new { id = await _mediator.Send(new CreateBoardCommand(projectId, request.Name, request.BoardType)) }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("{boardId}")]
    public async Task<IActionResult> Update(Guid projectId, Guid boardId, UpdateBoardRequest request)
    {
        try { await _mediator.Send(new UpdateBoardCommand(boardId, request.Name)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("{boardId}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid boardId)
    {
        try { await _mediator.Send(new DeleteBoardCommand(boardId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record CreateBoardRequest(string Name, string BoardType);
public record UpdateBoardRequest(string Name);