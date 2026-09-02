export interface ChangelogEntryItem {
    id: string;
    title: string;
    description: string;
    category: 'Feature' | 'Improvement' | 'Fix' | 'BreakingChange';
    publishedAt: string;
}