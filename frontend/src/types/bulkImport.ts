export interface ImportRow {
    tempKey: string;
    issueTypeName: string;
    title: string;
    description?: string;
    priority?: string;
    assigneeEmail?: string;
    parentTempKey?: string;
    storyPoint?: number;
}

export interface BulkImportResult {
    successCount: number;
    failCount: number;
    errors: { tempKey: string; message: string }[];
}