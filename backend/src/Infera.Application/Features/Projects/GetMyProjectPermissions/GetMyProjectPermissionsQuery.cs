using Infera.Application.Common.Interfaces;
using MediatR;

namespace Infera.Application.Features.Projects.GetMyProjectPermissions;

public record GetMyProjectPermissionsQuery(Guid ProjectId) : IRequest<MyProjectPermissionsDto>;
public record MyProjectPermissionsDto(bool CanManage);

public class GetMyProjectPermissionsQueryHandler : IRequestHandler<GetMyProjectPermissionsQuery, MyProjectPermissionsDto>
{
    private readonly IProjectManagementAuthService _projectAuth;
    public GetMyProjectPermissionsQueryHandler(IProjectManagementAuthService projectAuth) => _projectAuth = projectAuth;

    public async System.Threading.Tasks.Task<MyProjectPermissionsDto> Handle(GetMyProjectPermissionsQuery request, CancellationToken ct)
        => new(await _projectAuth.IsProjectManagerOrAdminAsync(request.ProjectId, ct));
}