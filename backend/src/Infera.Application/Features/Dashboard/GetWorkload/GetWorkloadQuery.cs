using MediatR;

namespace Infera.Application.Features.Dashboard.GetWorkload;

public record GetWorkloadQuery(Guid ProjectId) : IRequest<List<WorkloadDto>>;

public record WorkloadDto(Guid UserId, string UserName, int TaskCount, int TotalStoryPoints, int DoneCount);