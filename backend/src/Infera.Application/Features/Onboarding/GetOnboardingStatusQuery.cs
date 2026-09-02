using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Onboarding;

public record GetOnboardingStatusQuery : IRequest<OnboardingStatusDto>;

public record OnboardingStatusDto(bool HasAnyTeam, bool HasAnyProject, bool IsMemberOfAnyTeam, bool HasAnyTaskAssigned);

public class GetOnboardingStatusQueryHandler : IRequestHandler<GetOnboardingStatusQuery, OnboardingStatusDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public GetOnboardingStatusQueryHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<OnboardingStatusDto> Handle(GetOnboardingStatusQuery request, CancellationToken ct)
    {
        var hasAnyTeam = await _db.Teams.AnyAsync(ct);
        var hasAnyProject = await _db.Projects.AnyAsync(ct);
        var isMemberOfAnyTeam = await _db.TeamMembers.AnyAsync(m => m.UserId == _currentUser.UserId, ct);
        var hasAnyTaskAssigned = await _db.Tasks.AnyAsync(t => t.AssigneeId == _currentUser.UserId, ct);

        return new OnboardingStatusDto(hasAnyTeam, hasAnyProject, isMemberOfAnyTeam, hasAnyTaskAssigned);
    }
}