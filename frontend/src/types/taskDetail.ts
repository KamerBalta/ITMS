export interface CommentItem {
    id: string;
    userName: string;
    content: string;
    createdAt: string;
    isOwner: boolean;
}

export interface AttachmentItem {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number | null;
    uploadedByName: string;
    createdAt: string;
}

export interface ChecklistItemDto {
    id: string;
    itemText: string;
    isDone: boolean;
}

export interface ChecklistSummary {
    items: ChecklistItemDto[];
    totalCount: number;
    doneCount: number;
}

export interface WatcherItem {
    userId: string;
    userName: string;
}

export interface WorkLogItem {
    id: string;
    userName: string;
    timeSpentMinutes: number;
    description: string | null;
    loggedAt: string;
}

export interface WorkLogSummary {
    items: WorkLogItem[];
    totalMinutes: number;
}

export interface LabelItem {
    id: string;
    name: string;
    color: string | null;
}