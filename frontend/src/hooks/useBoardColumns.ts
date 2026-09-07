import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardColumnsApi } from '../api/boardColumns';

function invalidate(qc: ReturnType<typeof useQueryClient>, boardId: string) {
    qc.invalidateQueries({ queryKey: ['board-columns', boardId] });
    qc.invalidateQueries({ queryKey: ['board-column-settings', boardId] });
}

export function useBoardColumns(boardId: string | null) {
    return useQuery({
        queryKey: ['board-columns', boardId],
        queryFn: () => boardColumnsApi.getAll(boardId!),
        enabled: !!boardId,
    });
}

export function useBoardColumnSettings(boardId: string | null) {
    return useQuery({
        queryKey: ['board-column-settings', boardId],
        queryFn: () => boardColumnsApi.getSettings(boardId!),
        enabled: !!boardId,
    });
}

export function useCreateBoardColumn(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => boardColumnsApi.create(boardId, name),
        onSuccess: () => invalidate(qc, boardId),
    });
}

export function useUpdateBoardColumn(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            boardColumnsApi.update(boardId, id, name),
        onSuccess: () => invalidate(qc, boardId),
    });
}

export function useDeleteBoardColumn(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => boardColumnsApi.delete(boardId, id),
        onSuccess: () => invalidate(qc, boardId),
    });
}

export function useReorderBoardColumns(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => boardColumnsApi.reorder(boardId, ids),
        onSuccess: () => invalidate(qc, boardId),
    });
}

export function useMapStatusToColumn(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            statusId,
            columnId,
        }: {
            statusId: string;
            columnId: string | null;
        }) => boardColumnsApi.mapStatus(boardId, statusId, columnId),
        onSuccess: () => invalidate(qc, boardId),
    });
}

export function useUpdateWipLimit(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            columnId,
            wipLimit,
        }: {
            columnId: string;
            wipLimit: number | null;
        }) => boardColumnsApi.updateWipLimit(boardId, columnId, wipLimit),
        onSuccess: () => invalidate(qc, boardId),
    });
}