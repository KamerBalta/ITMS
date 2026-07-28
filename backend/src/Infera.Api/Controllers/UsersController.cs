using Infera.Application.Features.ProjectMembers.GetUserProjects;
using Infera.Application.Features.Users.CreateUser;
using Infera.Application.Features.Users.DeactivateUser;
using Infera.Application.Features.Users.GetUserById;
using Infera.Application.Features.Users.GetUsers;
using Infera.Application.Features.Users.UpdateUser;
using Infera.Application.Features.Users.UpdateUserRole;
using MediatR;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Infera.Application.Features.Users.UpdateMyAvatar;
using Infera.Application.Features.Users.UpdateMyProfile;
using Infera.Application.Features.Users.ChangePassword;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    public UsersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetUsersQuery());
        return Ok(result);
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetById(Guid userId)
    {
        try
        {
            var result = await _mediator.Send(new GetUserByIdQuery(userId));
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
    [HttpPost("me/avatar")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UpdateMyAvatar(IFormFile file)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            await using var stream = file.OpenReadStream();
            var path = await _mediator.Send(new UpdateMyAvatarCommand(userId, stream, file.FileName));
            return Ok(new { avatarUrl = path });
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

    [HttpGet("{userId}/projects")]
    public async Task<IActionResult> GetUserProjects(Guid userId)
    {
        var result = await _mediator.Send(new GetUserProjectsQuery(userId));
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Create(CreateUserRequest request)
    {
        try
        {
            var id = await _mediator.Send(new CreateUserCommand(request.Name, request.Email, request.Password, request.Title));
            return CreatedAtAction(nameof(GetById), new { userId = id }, new { id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{userId}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Update(Guid userId, UpdateUserRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateUserCommand(userId, request.Name, request.Title));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{userId}/role")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> UpdateRole(Guid userId, UpdateUserRoleRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateUserRoleCommand(userId, request.RoleName));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            var result = await _mediator.Send(new GetUserByIdQuery(userId));
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile(UpdateMyProfileRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            await _mediator.Send(new UpdateMyProfileCommand(userId, request.Name, request.Title));
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

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangeMyPassword(ChangePasswordRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            await _mediator.Send(new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{userId}/deactivate")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Deactivate(Guid userId)
    {
        try
        {
            await _mediator.Send(new DeactivateUserCommand(userId));
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
}

public record CreateUserRequest(string Name, string Email, string Password, string? Title);
public record UpdateUserRequest(string Name, string? Title);
public record UpdateUserRoleRequest(string RoleName);
public record UpdateMyProfileRequest(string Name, string? Title);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);