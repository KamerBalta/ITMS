import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { retrospectiveApi } from '../api/retrospective';
import type { RetroCategory } from '../types/retrospective';

export function useRetrospectiveNotes(sprintId: string | null) {
    return useQuery({
        queryKey: ['retrospective', sprintId],
        queryFn: () => retrospectiveApi.getAll(sprintId!),
        enabled: !!sprintId,
    });
}

export function useAddRetrospectiveNote(sprintId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ category, content }: { category: RetroCategory; content: string }) =>
            retrospectiveApi.add(sprintId, category, content),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['retrospective', sprintId] }),
    });
}

export function useToggleActionItem(sprintId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (noteId: string) => retrospectiveApi.toggle(sprintId, noteId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['retrospective', sprintId] }),
    });
}