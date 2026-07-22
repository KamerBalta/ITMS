using Infera.Application.Features.Teams.AddTeamMember;
using Infera.Application.Features.Teams.CreateTeam;
using Infera.Application.Features.Teams.GetTeams;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/teams")]
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly IMediator _mediator;
    public TeamsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetTeamsQuery());
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Create(CreateTeamRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userIdClaim is null)
            return Unauthorized();

        var id = await _mediator.Send(
            new CreateTeamCommand(
                request.Name,
                request.Description,
                Guid.Parse(userIdClaim)));

        return CreatedAtAction(nameof(GetAll), new { id }, new { id });
    }

    [HttpPost("{teamId}/members")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> AddMember(Guid teamId, AddMemberRequest request)
    {
        try
        {
            var id = await _mediator.Send(new AddTeamMemberCommand(teamId, request.UserId, request.TeamRole));
            return Ok(new { id });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}

public record CreateTeamRequest(string Name, string? Description);
public record AddMemberRequest(Guid UserId, string TeamRole);