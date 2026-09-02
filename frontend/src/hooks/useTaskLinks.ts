import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskLinksApi } from '../api/taskLinks';

export function useTaskLinks(taskId: string) {
    return useQuery({ queryKey: ['task-links', taskId], queryFn: () => taskLinksApi.getAll(taskId) });
}

export function useCreateTaskLink(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ targetTaskId, linkType }: { targetTaskId: string; linkType: string }) =>
            taskLinksApi.create(taskId, targetTaskId, linkType),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task-links', taskId] }),
    });
}

export function useDeleteTaskLink(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (linkId: string) => taskLinksApi.delete(taskId, linkId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task-links', taskId] }),
    });
}