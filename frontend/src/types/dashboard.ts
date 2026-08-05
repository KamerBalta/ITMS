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
export interface VelocityItem {
    sprintId: string;
    sprintName: string;
    committedPoints: number;
    completedPoints: number;
}

export interface BurndownPoint {
    date: string;
    remainingPoints: number;
}

export interface BurndownData {
    sprintName: string;
    startDate: string;
    endDate: string;
    totalStoryPoints: number;
    remainingStoryPoints: number;
    idealLine: BurndownPoint[];
    actualLine: BurndownPoint[];
}