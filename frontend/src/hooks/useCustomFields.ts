import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customFieldsApi } from '../api/customFields';

export function useCustomFields(projectId: string | null) {
    return useQuery({
        queryKey: ['custom-fields', projectId],
        queryFn: () => customFieldsApi.getAll(projectId!),
        enabled: !!projectId,
    });
}

export function useCreateCustomField(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; fieldType: string; optionsJson?: string; isRequired: boolean }) =>
            customFieldsApi.create(projectId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-fields', projectId] }),
    });
}

export function useDeleteCustomField(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (fieldId: string) => customFieldsApi.delete(projectId, fieldId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-fields', projectId] }),
    });
}

export function useTaskCustomFieldValues(taskId: string) {
    return useQuery({
        queryKey: ['task-custom-fields', taskId],
        queryFn: () => customFieldsApi.getTaskValues(taskId),
    });
}

export function useSetTaskCustomFieldValue(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ fieldId, value }: { fieldId: string; value: string | null }) => customFieldsApi.setTaskValue(taskId, fieldId, value),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task-custom-fields', taskId] }),
    });
}