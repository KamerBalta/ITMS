using Infera.Application.Features.SavedFilters;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/saved-filters")]
[Authorize]
public class SavedFiltersController : ControllerBase
{
    private readonly IMediator _mediator;
    public SavedFiltersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        Guid projectId,
        [FromQuery] string scope)
    {
        try
        {
            var result = await _mediator.Send(
                new GetSavedFiltersQuery(projectId, scope));

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, CreateSavedFilterRequest request)
    {
        try
        {
            var id = await _mediator.Send(
                new CreateSavedFilterCommand(
                    projectId,
                    request.Name,
                    request.FiltersJson,
                    request.IsShared,
                    request.Scope));

            return Ok(new { id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    [HttpDelete("{filterId}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid filterId)
    {
        try
        {
            await _mediator.Send(new DeleteSavedFilterCommand(filterId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }
}

public record CreateSavedFilterRequest(
    string Name,
    string FiltersJson,
    bool IsShared,
    string Scope);