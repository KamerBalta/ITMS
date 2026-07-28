export interface DashboardSummary {
    totalTasks: number;
    toDoCount: number;
    inProgressCount: number;
    readyForReviewCount: number;
    readyForQACount: number;
    doneCount: number;
    overdueCount: number;
    activeSprintName: string | null;
    activeSprintEndDate: string | null;
    activeSprintTaskCount: number;
}

export interface WorkloadItem {
    userId: string;
    userName: string;
    taskCount: number;
    totalStoryPoints: number;
    doneCount: number;
}