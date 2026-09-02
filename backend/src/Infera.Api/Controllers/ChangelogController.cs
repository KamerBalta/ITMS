using Infera.Application.Features.Changelog;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/changelog")]
[Authorize]
public class ChangelogController : ControllerBase
{
    private readonly IMediator _mediator;
    public ChangelogController(IMediator mediator) => _mediator = mediator;

    [HttpGet("unseen")]
    public async Task<IActionResult> GetUnseen() => Ok(await _mediator.Send(new GetUnseenChangelogQuery()));

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _mediator.Send(new GetAllChangelogQuery()));

    [HttpPost("mark-seen")]
    public async Task<IActionResult> MarkSeen()
    {
        await _mediator.Send(new MarkChangelogSeenCommand());
        return NoContent();
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Create(ChangelogEntryRequest request)
    {
        try { return Ok(new { id = await _mediator.Send(new CreateChangelogEntryCommand(request.Title, request.Description, request.Category)) }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record ChangelogEntryRequest(string Title, string Description, string Category);