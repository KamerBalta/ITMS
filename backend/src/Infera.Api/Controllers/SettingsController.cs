using Infera.Application.Features.Settings.DeleteSetting;
using Infera.Application.Features.Settings.GetSettings;
using Infera.Application.Features.Settings.UpsertSetting;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/settings")]
[Authorize(Policy = "RequireAdmin")]
public class SettingsController : ControllerBase
{
    private readonly IMediator _mediator;
    public SettingsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetSettingsQuery());
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Upsert(UpsertSettingRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            var id = await _mediator.Send(new UpsertSettingCommand(request.Key, request.Value, userId));
            return Ok(new { id });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{settingId}")]
    public async Task<IActionResult> Delete(Guid settingId)
    {
        try
        {
            await _mediator.Send(new DeleteSettingCommand(settingId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public record UpsertSettingRequest(string Key, string Value);