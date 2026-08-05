using Infera.Application.Features.Releases.CreateRelease;
using Infera.Application.Features.Releases.GetReleaseById;
using Infera.Application.Features.Releases.GetReleases;
using Infera.Application.Features.Releases.UpdateRelease;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/releases")]
[Authorize]
public class ReleasesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReleasesController(IMediator mediator) => _mediator = mediator;


    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(
                new GetReleasesQuery(projectId));

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }


    [HttpGet("{releaseId}")]
    public async Task<IActionResult> GetById(Guid releaseId)
    {
        try
        {
            var result = await _mediator.Send(
                new GetReleaseByIdQuery(releaseId));

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }


    [HttpPost]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Create(CreateReleaseRequest request)
    {
        try
        {
            var id = await _mediator.Send(
                new CreateReleaseCommand(
                    request.ProjectId,
                    request.Version,
                    request.ReleaseDate,
                    request.Description));

            return CreatedAtAction(
                nameof(GetById),
                new { releaseId = id },
                new { id });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }


    [HttpPut("{releaseId}")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Update(
        Guid releaseId,
        UpdateReleaseRequest request)
    {
        try
        {
            await _mediator.Send(
                new UpdateReleaseCommand(
                    releaseId,
                    request.ReleaseDate,
                    request.Description));

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }
}


public record CreateReleaseRequest(
    Guid ProjectId,
    string Version,
    DateOnly? ReleaseDate,
    string? Description);


public record UpdateReleaseRequest(
    DateOnly? ReleaseDate,
    string? Description);