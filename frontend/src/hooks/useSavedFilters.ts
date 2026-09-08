import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savedFiltersApi } from '../api/savedFilters';

export function useSavedFilters(projectId: string | null) {
    return useQuery({
        queryKey: ['saved-filters', projectId, 'board'],
        queryFn: () => savedFiltersApi.getAll(projectId!, 'board'),
        enabled: !!projectId,
    });
}

export function useCreateSavedFilter(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            name: string;
            filtersJson: string;
            isShared: boolean;
        }) =>
            savedFiltersApi.create(projectId, {
                ...data,
                scope: 'board',
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-filters', projectId] }),
    });
}

export function useDeleteSavedFilter(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (filterId: string) => savedFiltersApi.delete(projectId, filterId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-filters', projectId] }),
    });
}