using Infera.Application.Features.Onboarding;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/onboarding")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly IMediator _mediator;
    public OnboardingController(IMediator mediator) => _mediator = mediator;

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus() => Ok(await _mediator.Send(new GetOnboardingStatusQuery()));
}