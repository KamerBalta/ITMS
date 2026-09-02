using Infera.Application.Features.Search.GetSuggestions;
using Infera.Application.Features.Search.GlobalSearch;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/search")]
[Authorize]
[EnableRateLimiting("SearchPolicy")]
public class SearchController : ControllerBase
{
    private readonly IMediator _mediator;
    public SearchController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var result = await _mediator.Send(new GlobalSearchQuery(q));
        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> Suggestions([FromQuery] string q)
    {
        var result = await _mediator.Send(new GetSuggestionsQuery(q));
        return Ok(result);
    }
}