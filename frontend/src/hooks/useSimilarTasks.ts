import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { useDebouncedValue } from './useDebouncedValue';

export function useSimilarTasks(projectId: string | null, title: string, enabled: boolean) {
    const debouncedTitle = useDebouncedValue(title, 600);
    return useQuery({
        queryKey: ['similar-tasks', projectId, debouncedTitle],
        queryFn: () => tasksApi.findSimilar(projectId!, debouncedTitle),
        enabled: enabled && !!projectId && debouncedTitle.trim().length >= 8,
    });
}