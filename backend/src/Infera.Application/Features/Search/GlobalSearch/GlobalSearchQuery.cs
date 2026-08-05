using MediatR;

namespace Infera.Application.Features.Search.GlobalSearch;

public record GlobalSearchQuery(string Query) : IRequest<SearchResultsDto>;

public record SearchResultsDto(
    List<TaskResultDto> Tasks, List<ProjectResultDto> Projects, List<UserResultDto> Users);

public record TaskResultDto(Guid Id, string Title, string ProjectName, string Status);
public record ProjectResultDto(Guid Id, string Name, string Key);
public record UserResultDto(Guid Id, string Name, string Email);