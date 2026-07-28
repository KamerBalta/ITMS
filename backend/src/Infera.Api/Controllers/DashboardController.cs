using Infera.Application.Features.Dashboard.GetBurndown;
using Infera.Application.Features.Dashboard.GetDashboard;
using Infera.Application.Features.Dashboard.GetVelocity;
using Infera.Application.Features.Dashboard.GetWorkload;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;
    public DashboardController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetDashboardQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
       StatusCodes.Status403Forbidden,
       new { message = ex.Message });
        }
    }

    [HttpGet("workload")]
    public async Task<IActionResult> Workload([FromQuery] Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetWorkloadQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
        StatusCodes.Status403Forbidden,
        new { message = ex.Message });
        }
    }

    [HttpGet("velocity")]
    public async Task<IActionResult> Velocity([FromQuery] Guid projectId)
    {
        try
        {
            var result = await _mediator.Send(new GetVelocityQuery(projectId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
       StatusCodes.Status403Forbidden,
       new { message = ex.Message });
        }
    }

    [HttpGet("burndown")]
    public async Task<IActionResult> Burndown([FromQuery] Guid sprintId)
    {
        try
        {
            var result = await _mediator.Send(new GetBurndownQuery(sprintId));
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
}