export interface TaskLinkItem {
    linkId: string;
    linkType: 'Blocks' | 'RelatesTo' | 'Duplicates';
    direction: 'outgoing' | 'incoming';
    relatedTaskId: string;
    relatedTaskTitle: string;
    relatedIssueKey: string;
    relatedStatus: string;
}

export const LINK_TYPE_LABELS: Record<string, { outgoing: string; incoming: string }> = {
    Blocks: { outgoing: 'engelliyor', incoming: 'tarafından engelleniyor' },
    RelatesTo: { outgoing: 'ilişkili', incoming: 'ilişkili' },
    Duplicates: { outgoing: 'kopyası', incoming: 'tarafından kopyalanmış' },
};