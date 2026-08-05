using MediatR;

namespace Infera.Application.Features.Dashboard.GetVelocity;

public record GetVelocityQuery(Guid ProjectId) : IRequest<List<VelocityDto>>;

public record VelocityDto(Guid SprintId, string SprintName, int CommittedPoints, int CompletedPoints);