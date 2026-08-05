export type Priority = 0 | 1 | 2 | 3;
export type ItemStatus = 'ToDo' | 'InProgress' | 'ReadyForReview' | 'ReadyForQA' | 'Done' | 'Closed';

export const PRIORITY_LABELS: Record<Priority, string> = {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
    0: 'bg-gray-100 text-gray-600',
    1: 'bg-blue-100 text-blue-600',
    2: 'bg-orange-100 text-orange-600',
    3: 'bg-red-100 text-red-600',
};

export interface TaskListItem {
    id: string;
    title: string;
    issueType: string;
    issueTypeIcon: string | null;
    issueKey: string;
    issueTypeId: string | null;
    allowsChildren: boolean;
    requiresParent: boolean;
    priority: string;
    status: ItemStatus;
    storyPoint: number | null;
    assigneeName: string | null;
    sprintId: string | null;
    rank: number;
    parentTaskId: string | null;
}

export interface TaskDetail {
    id: string;
    title: string;
    description: string | null;
    issueType: string;
    issueTypeIcon: string | null;
    issueTypeId: string | null;
    allowsChildren: boolean;
    requiresParent: boolean;
    priority: string;
    status: ItemStatus;
    storyPoint: number | null;
    projectId: string;
    projectName: string;
    projectKey: string;
    issueKey: string;
    sprintId: string | null;
    parentTaskId: string | null;
    assigneeName: string | null;
    reporterName: string;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string | null;
    labels: string[];
    commentCount: number;
    attachmentCount: number;
    checklistTotal: number;
    checklistDone: number;
    watcherCount: number;
    releaseId: string | null;
    releaseVersion: string | null;
}

export interface CreateTaskPayload {
    projectId: string;
    sprintId?: string | null;
    parentTaskId?: string | null;
    issueTypeId: string;
    title: string;
    description?: string;
    priority: Priority;
    storyPoint?: number | null;
    assigneeId?: string | null;
    dueDate?: string | null;
}