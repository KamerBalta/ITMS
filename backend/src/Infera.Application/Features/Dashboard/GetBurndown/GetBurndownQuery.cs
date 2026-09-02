using MediatR;

namespace Infera.Application.Features.Dashboard.GetBurndown;

public record GetBurndownQuery(Guid SprintId) : IRequest<BurndownDto>;

public record BurndownDto(
    string SprintName, DateOnly StartDate, DateOnly EndDate,
    int TotalStoryPoints, int RemainingStoryPoints,
    List<BurndownPointDto> IdealLine, List<BurndownPointDto> ActualLine);

public record BurndownPointDto(DateTime Date, int RemainingPoints);