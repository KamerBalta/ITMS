import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardSettingsApi } from '../api/boardSettings';

export function useBoardColumnSettings(projectId: string | null) {
    return useQuery({
        queryKey: ['board-settings', projectId],
        queryFn: () => boardSettingsApi.getAll(projectId!),
        enabled: !!projectId,
    });
}

export function useUpdateWipLimit(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ statusId, wipLimit }: { statusId: string; wipLimit: number | null }) =>
            boardSettingsApi.updateWipLimit(projectId, statusId, wipLimit),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['board-settings', projectId] }),
    });
}