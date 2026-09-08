import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savedFiltersApi } from '../api/savedFilters';

const ISSUE_LIST_SAVED_FILTERS_KEY = 'issue-list-saved-filters';

export function useIssueListSavedFilters(projectId: string | null) {
    return useQuery({
        queryKey: [ISSUE_LIST_SAVED_FILTERS_KEY, projectId],
        queryFn: () => savedFiltersApi.getAll(projectId!, 'issue-list'),
        enabled: !!projectId,
    });
}

export function useCreateIssueListSavedFilter(projectId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            filtersJson: string;
            isShared: boolean;
        }) =>
            savedFiltersApi.create(projectId, {
                ...data,
                scope: 'issue-list',
            }),

        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: [ISSUE_LIST_SAVED_FILTERS_KEY, projectId],
            });
        },
    });
}

export function useDeleteIssueListSavedFilter(projectId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (filterId: string) =>
            savedFiltersApi.delete(projectId, filterId),

        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: [ISSUE_LIST_SAVED_FILTERS_KEY, projectId],
            });
        },
    });
}