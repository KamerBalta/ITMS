using MediatR;

namespace Infera.Application.Features.Projects.GetProjectById;

public record GetProjectByIdQuery(Guid ProjectId) : IRequest<ProjectDetailDto>;

public record ProjectDetailDto(
    Guid Id,
    string Name,
    string Key,
    string? Description,
    Guid OwnerId,
    string OwnerName,
    string Status,
    DateOnly? StartDate,
    DateOnly? EndDate,
    DateTime CreatedAt,
    List<string> TeamNames,
    int MemberCount,
    int TaskCount);