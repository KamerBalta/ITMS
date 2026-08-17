import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { componentsApi } from '../api/components';

export function useComponents(projectId: string | null) {
    return useQuery({
        queryKey: ['components', projectId],
        queryFn: () => componentsApi.getAll(projectId!),
        enabled: !!projectId,
    });
}

export function useCreateComponent(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string; leadUserId?: string | null }) => componentsApi.create(projectId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['components', projectId] }),
    });
}

export function useUpdateComponent(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; leadUserId?: string | null } }) =>
            componentsApi.update(projectId, id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['components', projectId] }),
    });
}

export function useDeleteComponent(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (componentId: string) => componentsApi.delete(projectId, componentId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['components', projectId] }),
    });
}

export function useAddComponentToTask(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (componentId: string) => componentsApi.addToTask(taskId, componentId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
    });
}

export function useRemoveComponentFromTask(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (componentId: string) => componentsApi.removeFromTask(taskId, componentId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
    });
}