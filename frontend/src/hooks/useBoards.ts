import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '../api/boards';
import { REFERENCE_STALE_TIME } from '../lib/queryClient';

export function useBoards(projectId: string | null) {
    return useQuery({
        queryKey: ['boards', projectId],
        queryFn: () => boardsApi.getAll(projectId!),
        enabled: !!projectId,
        staleTime: REFERENCE_STALE_TIME,
    });
}
export function useCreateBoard(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ name, boardType }: { name: string; boardType: string }) => boardsApi.create(projectId, name, boardType),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['boards', projectId] }),
    });
}
export function useDeleteBoard(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (boardId: string) => boardsApi.delete(projectId, boardId), onSuccess: () => qc.invalidateQueries({ queryKey: ['boards', projectId] }) });
}