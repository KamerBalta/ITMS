using Infera.Application.Features.BoardColumns;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/boards/{boardId}/columns")]
[Authorize]
public class BoardColumnsController : ControllerBase
{
    private readonly IMediator _mediator;
    public BoardColumnsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid boardId)
    {
        try { return Ok(await _mediator.Send(new GetBoardColumnsQuery(boardId))); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid boardId, BoardColumnRequest request)
    {
        try { return Ok(new { id = await _mediator.Send(new CreateBoardColumnCommand(boardId, request.Name)) }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("{columnId}")]
    public async Task<IActionResult> Update(Guid boardId, Guid columnId, BoardColumnRequest request)
    {
        try { await _mediator.Send(new UpdateBoardColumnCommand(columnId, request.Name)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("{columnId}")]
    public async Task<IActionResult> Delete(Guid boardId, Guid columnId)
    {
        try { await _mediator.Send(new DeleteBoardColumnCommand(columnId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder(Guid boardId, ReorderColumnsRequest request)
    {
        try { await _mediator.Send(new ReorderBoardColumnsCommand(boardId, request.OrderedIds)); return NoContent(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("map-status")]
    public async Task<IActionResult> MapStatus(Guid boardId, MapStatusRequest request)
    {
        try { await _mediator.Send(new MapStatusToColumnCommand(boardId, request.StatusId, request.ColumnId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record BoardColumnRequest(string Name);
public record ReorderColumnsRequest(List<Guid> OrderedIds);
public record MapStatusRequest(Guid StatusId, Guid? ColumnId);