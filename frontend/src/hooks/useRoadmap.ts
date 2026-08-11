import { useQuery } from '@tanstack/react-query';
import { roadmapApi } from '../api/roadmap';

export function useRoadmap(projectId: string | null) {
    return useQuery({
        queryKey: ['roadmap', projectId],
        queryFn: () => roadmapApi.get(projectId!),
        enabled: !!projectId,
    });
}