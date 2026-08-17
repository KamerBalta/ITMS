import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backlogApi } from '../api/backlog';

export function useBacklog(projectId: string | null, page = 1, pageSize = 25) {
    return useQuery({
        queryKey: ['backlog', projectId, page, pageSize],
        queryFn: () => backlogApi.get(projectId!, page, pageSize),
        enabled: !!projectId,
    });
}
export function useMoveToSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, sprintId }: { taskId: string; sprintId: string }) =>
            backlogApi.moveToSprint(taskId, sprintId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
            queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
}

export function useRemoveFromSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: string) => backlogApi.removeFromSprint(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
            queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
}