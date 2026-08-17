export interface AuditHistoryItem {
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
    userName: string;
    timestamp: string;
}