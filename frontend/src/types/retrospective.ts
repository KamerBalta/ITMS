export type RetroCategory = 'WentWell' | 'WentWrong' | 'ActionItem';

export interface RetrospectiveNote {
    id: string;
    userName: string;
    category: RetroCategory;
    content: string;
    isResolved: boolean;
    createdAt: string;
}