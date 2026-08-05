using MediatR;
using Infera.Domain.Enums;

namespace Infera.Application.Features.Backlog.GetBacklog;

public record GetBacklogQuery(
    Guid ProjectId,
    IssueType? IssueType,
    Priority? Priority,
    Guid? AssigneeId,
    string? Search,
    int Page = 1,
    int PageSize = 20
) : IRequest<List<BacklogTaskDto>>;

public record BacklogTaskDto(
    Guid Id,
    string Title,
    string IssueType,
    string Priority,
    int? StoryPoint,
    Guid? AssigneeId,
    string? AssigneeName,
    long Rank
);