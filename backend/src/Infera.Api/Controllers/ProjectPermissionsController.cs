using Infera.Application.Features.ProjectPermissions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/permissions")]
[Authorize]
public class ProjectPermissionsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ProjectPermissionsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetProjectPermissionsQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("{permissionKey}")]
    public async Task<IActionResult> Set(Guid projectId, string permissionKey, SetPermissionRequest request)
    {
        try
        {
            await _mediator.Send(new SetProjectPermissionCommand(projectId, permissionKey, request.IsEnabled));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record SetPermissionRequest(bool IsEnabled);