using Infera.Application.Features.Notifications.DeleteNotification;
using Infera.Application.Features.Notifications.GetNotifications;
using Infera.Application.Features.Notifications.MarkAllAsRead;
using Infera.Application.Features.Notifications.MarkAsRead;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    public NotificationsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        var result = await _mediator.Send(new GetNotificationsQuery(userId));
        return Ok(result);
    }

    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            await _mediator.Send(new MarkAsReadCommand(notificationId, userId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        await _mediator.Send(new MarkAllAsReadCommand(userId));
        return NoContent();
    }

    [HttpDelete("{notificationId}")]
    public async Task<IActionResult> Delete(Guid notificationId)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            await _mediator.Send(new DeleteNotificationCommand(notificationId, userId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }
}