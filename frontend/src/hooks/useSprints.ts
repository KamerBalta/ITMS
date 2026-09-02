import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sprintsApi } from '../api/sprints';
import type { CreateSprintPayload } from '../types/sprint';

export function useSprints(projectId: string | null) {
    return useQuery({
        queryKey: ['sprints', projectId],
        queryFn: () => sprintsApi.getAll(projectId!),
        enabled: !!projectId,
        retry: false,
    });
}

// Aktif sprint'i (varsa) tum sprint listesinden bulan kucuk yardimci hook --
// backend'de ayri bir "GET /sprints/active" endpoint'i yoktu, listede filtreliyoruz.
export function useActiveSprint(projectId: string | null) {
    const { data: sprints, ...rest } = useSprints(projectId);
    const activeSprint = sprints?.find((s) => s.status === 'Active') ?? null;
    return { activeSprint, sprints, ...rest };
}

export function useCreateSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateSprintPayload) => sprintsApi.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints', projectId] }),
    });
}

export function useCompleteSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sprintId: string) => sprintsApi.complete(sprintId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}
export function useUpdateSprint(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sprintId, data }: { sprintId: string; data: { name: string; goal?: string; startDate: string; endDate: string } }) =>
            sprintsApi.update(sprintId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
    });
}