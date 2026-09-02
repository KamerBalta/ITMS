using Infera.Application.Features.ProjectAccess.RequestProjectAccess;
using Infera.Application.Features.Projects.AddTeamToProject;
using Infera.Application.Features.Projects.ArchiveProject;
using Infera.Application.Features.Projects.CreateProject;
using Infera.Application.Features.Projects.DeleteProject;
using Infera.Application.Features.Projects.GetMyProjectPermissions;
using Infera.Application.Features.Projects.GetProjectById;
using Infera.Application.Features.Projects.GetProjects;
using Infera.Application.Features.Projects.RemoveTeamFromProject;
using Infera.Application.Features.Projects.UnarchiveProject;
using Infera.Application.Features.Projects.UpdateProject;
using Infera.Application.Features.Tasks.BulkImport;
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

    public ProjectsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var result = await _mediator.Send(new GetProjectsQuery());
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpGet("{projectId}")]
    public async Task<IActionResult> GetById(Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetProjectByIdQuery(projectId));
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
    public async Task<IActionResult> Create(CreateProjectRequest request)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue("sub")!);
        var ownerId = request.OwnerId ?? currentUserId;

        try
        {
            var id = await _mediator.Send(
                new CreateProjectCommand(
                    request.Name,
                    request.Key,
                    request.Description,
                    ownerId,
                    request.TeamIds,
                    request.StartDate));

            return CreatedAtAction(
                nameof(GetById),
                new { projectId = id },
                new { id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
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

    [HttpPut("{projectId}")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Update(
        Guid projectId,
        UpdateProjectRequest request)
    {
        try
        {
            await _mediator.Send(
                new UpdateProjectCommand(
                    projectId,
                    request.Name,
                    request.Description,
                    request.StartDate,
                    request.EndDate));

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

    [HttpDelete("{projectId}")]
    public async Task<IActionResult> Delete(Guid projectId)
    {
        try
        {
            await _mediator.Send(new DeleteProjectCommand(projectId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{projectId}/archive")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Archive(Guid projectId)
    {
        try
        {
            await _mediator.Send(new ArchiveProjectCommand(projectId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{projectId}/unarchive")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Unarchive(Guid projectId)
    {
        try
        {
            await _mediator.Send(new UnarchiveProjectCommand(projectId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpGet("{projectId}/my-permissions")]
    public async Task<IActionResult> GetMyPermissions(Guid projectId)
    {
        var result = await _mediator.Send(new GetMyProjectPermissionsQuery(projectId));
        return Ok(result);
    }

    [HttpPost("{projectId}/request-access")]
    public async Task<IActionResult> RequestAccess(Guid projectId, RequestAccessRequest request)
    {
        try
        {
            await _mediator.Send(new RequestProjectAccessCommand(projectId, request.Message));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("{projectId}/teams/{teamId}")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> AddTeam(Guid projectId, Guid teamId)
    {
        try
        {
            var id = await _mediator.Send(
                new AddTeamToProjectCommand(projectId, teamId));

            return Ok(new { id });
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

    [HttpDelete("{projectId}/teams/{teamId}")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> RemoveTeam(Guid projectId, Guid teamId)
    {
        try
        {
            await _mediator.Send(
                new RemoveTeamFromProjectCommand(projectId, teamId));

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPost("{projectId}/bulk-import")]
    public async Task<IActionResult> BulkImport(Guid projectId, [FromBody] BulkImportRequest request)
    {
        try
        {
            var result = await _mediator.Send(new BulkImportTasksCommand(projectId, request.Rows));
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }
}

public record CreateProjectRequest(
    string Name,
    string Key,
    string? Description,
    Guid? OwnerId,
    List<Guid> TeamIds,
    DateOnly? StartDate);

public record UpdateProjectRequest(
    string Name,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate);

public record BulkImportRequest(List<ImportRowDto> Rows);

public record RequestAccessRequest(string? Message);