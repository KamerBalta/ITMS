import { apiClient } from './client';
import type { ImportRow, BulkImportResult } from '../types/bulkImport';

export const bulkImportApi = {
    import: async (projectId: string, rows: ImportRow[]): Promise<BulkImportResult> => {
        // Hatalı: apiClient.post(`/tasks/projects/${projectId}/bulk-import`, { rows })
        // Doğru:
        const response = await apiClient.post<BulkImportResult>(`/projects/${projectId}/bulk-import`, {
            rows,
        });
        return response.data;
    },
};