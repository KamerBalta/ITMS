import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';

interface BulkResult {
    successCount: number;
    failCount: number;
}

export function useBulkUpdateStatus(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskIds, status }: { taskIds: string[]; status: number }): Promise<BulkResult> => {
            const results = await Promise.allSettled(taskIds.map((id) => tasksApi.updateStatus(id, status)));
            const successCount = results.filter((r) => r.status === 'fulfilled').length;
            return { successCount, failCount: results.length - successCount };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
    });
}

export function useBulkReassign(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskIds, assigneeId }: { taskIds: string[]; assigneeId: string | null }): Promise<BulkResult> => {
            const results = await Promise.allSettled(taskIds.map((id) => tasksApi.reassign(id, assigneeId)));
            const successCount = results.filter((r) => r.status === 'fulfilled').length;
            return { successCount, failCount: results.length - successCount };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
    });
}

export function useBulkAddLabel(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskIds, labelId }: { taskIds: string[]; labelId: string }): Promise<BulkResult> => {
            const results = await Promise.allSettled(
                taskIds.map((id) => import('../api/taskDetail').then((m) => m.labelsApi.addToTask(id, labelId)))
            );
            const successCount = results.filter((r) => r.status === 'fulfilled').length;
            return { successCount, failCount: results.length - successCount };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
    });
}