import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import type { CreateTaskPayload } from '../types/task';

export function useTasks(projectId: string | null, sprintId?: string | null, backlogOnly?: boolean) {
    return useQuery({
        queryKey: ['tasks', projectId, sprintId, backlogOnly],
        queryFn: () => tasksApi.getAll({ projectId: projectId!, sprintId, backlogOnly }),
        enabled: !!projectId,
    });
}

export function useCreateTask(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTaskPayload) => tasksApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary', projectId] });
        },
    });
}

export function useUpdateTaskStatus(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: number }) => tasksApi.updateStatus(taskId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary', projectId] });
        },
    });
}

export function useReassignTask(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string | null }) =>
            tasksApi.reassign(taskId, assigneeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'workload', projectId] });
        },
    });
}