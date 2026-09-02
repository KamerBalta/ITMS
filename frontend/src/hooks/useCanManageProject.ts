import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useCanManageProject(projectId: string | null) {
    const query = useQuery({
        queryKey: ['can-manage-project', projectId],
        queryFn: () =>
            apiClient.get<{ canManage: boolean }>(`/projects/${projectId}/my-permissions`).then((res) => res.data.canManage),
        enabled: !!projectId,
    });
    return query.data ?? false;
}