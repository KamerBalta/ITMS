import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { tasksApi } from '../api/tasks';

interface BulkResult {
    successCount: number;
    failCount: number;
    errors?: string[];
}

export function useBulkUpdateStatus(projectId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (data: { taskIds: string[]; statusId: string }) =>
            apiClient
                .put<{ successCount: number; failCount: number; errors: string[] }>('/tasks/bulk/status', {
                    taskIds: data.taskIds,
                    newStatusId: data.statusId,
                })
                .then((res) => res.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useBulkReassign(projectId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            taskIds,
            assigneeId,
        }: {
            taskIds: string[];
            assigneeId: string | null;
        }): Promise<BulkResult> => {
            const results = await Promise.allSettled(
                taskIds.map((id) => tasksApi.reassign(id, assigneeId))
            );

            const successCount = results.filter(
                (r) => r.status === 'fulfilled'
            ).length;

            return {
                successCount,
                failCount: results.length - successCount,
            };
        },

        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: ['tasks', projectId],
            });
        },
    });
}

export function useBulkMoveToSprint(projectId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (data: { taskIds: string[]; sprintId: string | null }) =>
            apiClient
                .put<{ successCount: number; failCount: number; errors: string[] }>('/tasks/bulk/move-to-sprint', {
                    taskIds: data.taskIds,
                    sprintId: data.sprintId,
                })
                .then((res) => res.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            qc.invalidateQueries({ queryKey: ['backlog', projectId] });
        },
    });
}

export function useBulkAddLabel(projectId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (data: { taskIds: string[]; labelId: string }) =>
            apiClient
                .post<{ successCount: number; failCount: number; errors: string[] }>('/tasks/bulk/add-label', {
                    taskIds: data.taskIds,
                    labelId: data.labelId,
                })
                .then((res) => res.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
}

export function useBulkDelete(projectId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (taskIds: string[]) =>
            apiClient
                .delete<{ successCount: number; failCount: number; errors: string[] }>('/tasks/bulk', {
                    data: { taskIds },
                })
                .then((res) => res.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            qc.invalidateQueries({ queryKey: ['backlog', projectId] });
        },
    });
}