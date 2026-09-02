using Infera.Application.Features.IssueTemplates;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/issue-templates")]
[Authorize]
public class IssueTemplatesController : ControllerBase
{
    private readonly IMediator _mediator;
    public IssueTemplatesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        try { return Ok(await _mediator.Send(new GetIssueTemplatesQuery(projectId))); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, IssueTemplateRequest request)
    {
        try { return Ok(new { id = await _mediator.Send(new CreateIssueTemplateCommand(projectId, request.IssueTypeId, request.Name, request.DescriptionTemplate, request.DefaultPriority, request.IsDefault)) }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("{templateId}")]
    public async Task<IActionResult> Update(Guid projectId, Guid templateId, IssueTemplateRequest request)
    {
        try { await _mediator.Send(new UpdateIssueTemplateCommand(templateId, request.Name, request.DescriptionTemplate, request.DefaultPriority, request.IsDefault)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("{templateId}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid templateId)
    {
        try { await _mediator.Send(new DeleteIssueTemplateCommand(templateId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record IssueTemplateRequest(Guid IssueTypeId, string Name, string? DescriptionTemplate, int? DefaultPriority, bool IsDefault);