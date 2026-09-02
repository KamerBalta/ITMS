export interface WorkflowStatus {
    id: string;
    name: string;
    category: 'ToDo' | 'InProgress' | 'Done';
    color: string | null;
    displayOrder: number;
    isInitial: boolean;
    isEpicCloseTarget: boolean;
    isDraft: boolean;
    boardColumnId: string | null;
}

export interface WorkflowTransition {
    id: string;
    fromStatusId: string;
    fromStatusName: string;
    toStatusId: string;
    toStatusName: string;
    allowedRoles: string[];
    requireAssigneeSelf: boolean;
    isDraft: boolean;
}