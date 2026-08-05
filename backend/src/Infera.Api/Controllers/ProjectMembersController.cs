using Infera.Application.Features.ProjectMembers.AddProjectMember;
using Infera.Application.Features.ProjectMembers.GetProjectMembers;
using Infera.Application.Features.ProjectMembers.RemoveProjectMember;
using Infera.Domain.Enums;
using Infera.Application.Features.ProjectMembers.UpdateProjectMember;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/members")]
[Authorize]
public class ProjectMembersController : ControllerBase
{
    private readonly IMediator _mediator;
    public ProjectMembersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetMembers(Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetProjectMembersQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> AddMember(Guid projectId, AddProjectMemberRequest request)
    {
        try
        {
            var id = await _mediator.Send(new AddProjectMemberCommand(
                projectId, request.TeamId, request.UserId, request.ProjectRole));
            return Ok(new { id });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{memberId}")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> UpdateMember(
    Guid projectId,
    Guid memberId,
    UpdateProjectMemberRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateProjectMemberCommand(
                projectId,
                memberId,
                request.TeamId,
                request.ProjectRole));

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{memberId}")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> RemoveMember(Guid projectId, Guid memberId)
    {
        try
        {
            await _mediator.Send(new RemoveProjectMemberCommand(projectId, memberId));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public record AddProjectMemberRequest(Guid TeamId, Guid UserId, ProjectRole ProjectRole);
public record UpdateProjectMemberRequest(
    Guid TeamId,
    ProjectRole ProjectRole);