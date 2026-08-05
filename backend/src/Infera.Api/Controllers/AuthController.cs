using Infera.Application.Features.Auth.Login;
using Infera.Application.Features.Auth.Refresh;
using Infera.Application.Features.Auth.Logout;
using Infera.Application.Features.Auth.ForgotPassword;
using Infera.Application.Features.Auth.ResetPassword;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Infera.Application.Features.Auth.ActivateAccount;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("LoginPolicy")]
    public async Task<IActionResult> Login(LoginCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(RefreshTokenCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("activate-account")]
    [AllowAnonymous]
    public async Task<IActionResult> ActivateAccount(ActivateAccountCommand command)
    {
        try
        {
            await _mediator.Send(command);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(LogoutCommand command)
    {
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("ForgotPasswordPolicy")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordCommand command)
    {
        await _mediator.Send(command);

        // Güvenlik: kullanıcı var mı yok mu fark etmeksizin aynı mesaj dönülür.
        return Ok(new
        {
            message = "E-posta adresiniz sistemde kayıtlıysa, sıfırlama bağlantısı gönderildi."
        });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(ResetPasswordCommand command)
    {
        try
        {
            await _mediator.Send(command);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"),
            Email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email"),
            Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
        });
    }
}