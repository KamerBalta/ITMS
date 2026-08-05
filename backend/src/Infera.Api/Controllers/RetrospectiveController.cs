using Infera.Application.Features.Retrospective.AddRetrospectiveNote;
using Infera.Application.Features.Retrospective.GetRetrospectiveNotes;
using Infera.Application.Features.Retrospective.ToggleActionItem;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/sprints/{sprintId}/retrospective")]
[Authorize]
public class RetrospectiveController : ControllerBase
{
    private readonly IMediator _mediator;
    public RetrospectiveController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid sprintId)
    {
        try
        {
            var result = await _mediator.Send(new GetRetrospectiveNotesQuery(sprintId));
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> Add(Guid sprintId, AddNoteRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            var id = await _mediator.Send(new AddRetrospectiveNoteCommand(sprintId, userId, request.Category, request.Content));
            return CreatedAtAction(nameof(GetAll), new { sprintId }, new { id });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{noteId}/toggle")]
    public async Task<IActionResult> Toggle(Guid sprintId, Guid noteId)
    {
        try
        {
            await _mediator.Send(new ToggleActionItemCommand(noteId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}

public record AddNoteRequest(string Category, string Content);