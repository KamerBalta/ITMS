export type SprintStatus = 'Active' | 'Completed';

export interface SprintListItem {
    id: string;
    name: string;
    goal: string | null;
    startDate: string;
    endDate: string;
    status: SprintStatus;
    taskCount: number;
    totalStoryPoints: number;
}

export interface CreateSprintPayload {
    projectId: string;
    name: string;
    goal?: string;
    startDate: string;
    endDate: string;
}