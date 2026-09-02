import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labelsApi } from '../api/taskDetail';

export function useLabels() {
    return useQuery({ queryKey: ['labels'], queryFn: labelsApi.getAll });
}

export function useCreateLabel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; color?: string }) =>
            labelsApi.create(data).then((res) => res.data as { id: string }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['labels'] }),
    });
}