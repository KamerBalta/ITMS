import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import type { CreateTaskPayload } from '../types/task';

export function useTasks(
    projectId: string | null,
    extraParams?: {
        sprintId?: string | null;
        backlogOnly?: boolean;
        assigneeId?: string;
        status?: string;
        issueTypeId?: string;
        priority?: number;
        labelId?: string;
        search?: string;
        parentTaskId?: string;
    }
) {
    return useQuery({
        queryKey: ['tasks', projectId, extraParams],
        queryFn: () => tasksApi.getAll({ projectId: projectId!, ...extraParams }),
        enabled: !!projectId,
    });
}

// Ust gorev secici icin -- AllowsChildren=true olan gorevleri client-side filtreliyoruz
export function useParentCandidates(projectId: string | null) {
    const { data, ...rest } = useTasks(projectId);
    return { data: data?.filter((t) => t.allowsChildren), ...rest };
}

export function useCreateTask(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTaskPayload) => tasksApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
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