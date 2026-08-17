using Infera.Application.Features.Automation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/automation-rules")]
[Authorize]
public class AutomationController : ControllerBase
{
    private readonly IMediator _mediator;
    public AutomationController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetAutomationRulesQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, AutomationRuleRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateAutomationRuleCommand(projectId, request.Name, request.TriggerType, request.TriggerConditionJson, request.ActionType, request.ActionParamsJson));
            return Ok(new { id });
        }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("{ruleId}/toggle")]
    public async Task<IActionResult> Toggle(Guid projectId, Guid ruleId)
    {
        try { await _mediator.Send(new ToggleAutomationRuleCommand(ruleId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpDelete("{ruleId}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid ruleId)
    {
        try { await _mediator.Send(new DeleteAutomationRuleCommand(ruleId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }
}

public record AutomationRuleRequest(string Name, string TriggerType, string? TriggerConditionJson, string ActionType, string ActionParamsJson);