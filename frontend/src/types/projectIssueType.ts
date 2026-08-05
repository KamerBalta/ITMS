export interface ProjectIssueType {
    issueTypeId: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    creatorTier: 0 | 1 | 2;
    allowsChildren: boolean;
    requiresParent: boolean;
    isSystemDefault: boolean;
    isActive: boolean;
    displayOrder: number;
}