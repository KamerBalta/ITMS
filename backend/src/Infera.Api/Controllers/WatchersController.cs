using Infera.Application.Features.Watchers.AddWatcher;
using Infera.Application.Features.Watchers.GetWatchers;
using Infera.Application.Features.Watchers.RemoveWatcher;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks/{taskId}/watchers")]
[Authorize]
public class WatchersController : ControllerBase
{
    private readonly IMediator _mediator;

    public WatchersController(IMediator mediator) => _mediator = mediator;


    [HttpGet]
    public async Task<IActionResult> GetAll(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(
                new GetWatchersQuery(taskId));

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }


    [HttpPost]
    public async Task<IActionResult> Add(Guid taskId)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);

        try
        {
            await _mediator.Send(
                new AddWatcherCommand(
                    taskId,
                    userId));

            return NoContent();
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


    [HttpDelete]
    public async Task<IActionResult> Remove(Guid taskId)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);

        try
        {
            await _mediator.Send(
                new RemoveWatcherCommand(
                    taskId,
                    userId));

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
}