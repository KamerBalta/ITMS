using MediatR;

namespace Infera.Application.Features.Dashboard.GetBurndown;

public record GetBurndownQuery(Guid SprintId) : IRequest<BurndownDto>;

public record BurndownDto(
    string SprintName, DateTime StartDate, DateTime EndDate,
    int TotalStoryPoints, int RemainingStoryPoints,
    List<BurndownPointDto> IdealLine, List<BurndownPointDto> ActualLine);

public record BurndownPointDto(DateTime Date, int RemainingPoints);