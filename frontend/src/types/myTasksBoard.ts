export interface MyTaskBoardItem {
    id: string;
    title: string;
    issueKey: string;
    projectName: string;
    projectId: string;
    statusName: string;
    statusCategory: 'ToDo' | 'InProgress' | 'Done';
    priority: string;
    issueTypeIcon: string | null;
}