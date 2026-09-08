export type FilterField = 'status' | 'assignee' | 'reporter' | 'priority' | 'issueType' | 'sprint' | 'label' | 'component' | 'created' | 'dueDate' | 'updated';

export interface ActiveFilterCriterion {
    id: string; // her chip'in benzersiz local id'si
    field: FilterField;
    value: string; // secilen deger (statik alanlar icin id/enum), tarih alanlari icin "after:2026-01-01" formatinda
    label: string; // chip'te gosterilen okunabilir metin, orn. "Status: In Progress"
}

export const FILTER_FIELD_LABELS: Record<FilterField, string> = {
    status: 'Status', assignee: 'Assignee', reporter: 'Reporter', priority: 'Priority',
    issueType: 'Issue Type', sprint: 'Sprint', label: 'Labels', component: 'Components',
    created: 'Created', dueDate: 'Due Date', updated: 'Updated',
};

// Issue Listesi filtrelerinin, backend'e giden gercek query parametrelerine cevirisi.
export interface ResolvedFilterQuery {
    status?: string; assigneeId?: string; unassignedOnly?: boolean; reporterId?: string;
    priority?: number; issueTypeId?: string; sprintId?: string; backlogOnly?: boolean;
    labelId?: string; componentId?: string;
    createdAfter?: string; createdBefore?: string;
    dueDateAfter?: string; dueDateBefore?: string;
    updatedAfter?: string; updatedBefore?: string;
}