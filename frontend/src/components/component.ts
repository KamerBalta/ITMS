export interface ProjectComponentItem {
    id: string;
    name: string;
    description: string | null;
    leadUserId: string | null;
    leadUserName: string | null;
    taskCount: number;
}