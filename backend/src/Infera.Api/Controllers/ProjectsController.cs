using Infera.Application.Features.Projects.CreateProject;
using Infera.Application.Features.Projects.GetProjects;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ProjectsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetProjectsQuery());
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Create(CreateProjectRequest request)
    {
        var currentUserId = Guid.Parse(
     User.FindFirstValue(ClaimTypes.NameIdentifier)
         ?? throw new UnauthorizedAccessException("UserId claim bulunamadı.")
 );
        // OwnerId body'de gelmezse istegi atan kisi Owner olur (PM kendi projesini acar)
        var ownerId = request.OwnerId ?? currentUserId;

        try
        {
            var id = await _mediator.Send(new CreateProjectCommand(
                request.Name, request.Key, request.Description, ownerId, request.TeamIds, request.StartDate));
            return CreatedAtAction(nameof(GetAll), new { id }, new { id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public record CreateProjectRequest(
    string Name, string Key, string? Description,
    Guid? OwnerId, List<Guid> TeamIds, DateOnly? StartDate);