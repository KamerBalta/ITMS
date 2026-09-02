import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectPermissionsApi } from '../api/projectPermissions';

export function useProjectPermissions(projectId: string | null) {
    return useQuery({
        queryKey: ['project-permissions', projectId],
        queryFn: () => projectPermissionsApi.getAll(projectId!),
        enabled: !!projectId,
    });
}

export function useSetProjectPermission(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) => projectPermissionsApi.set(projectId, key, isEnabled),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['project-permissions', projectId] }),
    });
}