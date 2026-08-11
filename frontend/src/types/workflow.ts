export interface WorkflowTransition {
    id: string;
    fromStatus: string;
    toStatus: string;
    allowedRoles: string[];
    requireAssigneeSelf: boolean;
}