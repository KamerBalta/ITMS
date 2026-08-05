using Infera.Application.Features.Teams.AddTeamMember;
using Infera.Application.Features.Teams.CreateTeam;
using Infera.Application.Features.Teams.GetTeamById;
using Infera.Application.Features.Teams.GetTeams;
using Infera.Application.Features.Teams.RemoveTeamMember;
using Infera.Application.Features.Teams.UpdateTeam;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Infera.Application.Features.Teams.DeleteTeam;
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

    [HttpGet("{teamId}")]
    public async Task<IActionResult> GetById(Guid teamId)
    {
        try
        {
            var result = await _mediator.Send(new GetTeamByIdQuery(teamId));
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Create(CreateTeamRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            var id = await _mediator.Send(new CreateTeamCommand(request.Name, request.Description, userId));
            return CreatedAtAction(nameof(GetById), new { teamId = id }, new { id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
    [HttpDelete("{teamId}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(Guid teamId)
    {
        try
        {
            await _mediator.Send(new DeleteTeamCommand(teamId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{teamId}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Update(Guid teamId, UpdateTeamRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateTeamCommand(teamId, request.Name, request.Description));
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

    [HttpDelete("{teamId}/members/{userId}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> RemoveMember(Guid teamId, Guid userId)
    {
        try
        {
            await _mediator.Send(new RemoveTeamMemberCommand(teamId, userId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public record CreateTeamRequest(string Name, string? Description);
public record AddMemberRequest(Guid UserId, string TeamRole);
public record UpdateTeamRequest(string Name, string? Description);