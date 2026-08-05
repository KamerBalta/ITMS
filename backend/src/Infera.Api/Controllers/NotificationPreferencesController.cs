using Infera.Application.Features.NotificationPreferences;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/notification-preferences")]
[Authorize]
public class NotificationPreferencesController : ControllerBase
{
    private readonly IMediator _mediator;
    public NotificationPreferencesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        var result = await _mediator.Send(new GetMyNotificationPreferencesQuery(userId));
        return Ok(result);
    }

    [HttpPut("{notificationType}")]
    public async Task<IActionResult> Update(string notificationType, UpdatePreferenceRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        await _mediator.Send(new UpdateNotificationPreferenceCommand(userId, notificationType, request.InAppEnabled, request.EmailEnabled));
        return NoContent();
    }
}

public record UpdatePreferenceRequest(bool InAppEnabled, bool EmailEnabled);