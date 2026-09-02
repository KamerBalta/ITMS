using Infera.Application.Features.GitIntegration;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/git-integration")]
[Authorize]
public class GitIntegrationController : ControllerBase
{
    private readonly IMediator _mediator;
    public GitIntegrationController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Get(Guid projectId)
    {
        try { return Ok(await _mediator.Send(new GetGitIntegrationQuery(projectId))); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> Setup(Guid projectId, SetupGitIntegrationRequest request)
    {
        try { return Ok(await _mediator.Send(new SetupGitIntegrationCommand(projectId, request.Provider, request.RepositoryUrl, request.CloseTargetStatusId))); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(Guid projectId)
    {
        try { await _mediator.Send(new DeleteGitIntegrationCommand(projectId)); return NoContent(); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record SetupGitIntegrationRequest(string Provider, string RepositoryUrl, Guid? CloseTargetStatusId);