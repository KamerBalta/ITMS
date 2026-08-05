using MediatR;

namespace Infera.Application.Features.Dashboard.GetDashboard;

public record GetDashboardQuery(Guid ProjectId) : IRequest<DashboardDto>;

public record DashboardDto(
    int TotalTasks, int ToDoCount, int InProgressCount, int ReadyForReviewCount,
    int ReadyForQACount, int DoneCount, int OverdueCount,
    string? ActiveSprintName, DateTime? ActiveSprintEndDate, int ActiveSprintTaskCount);