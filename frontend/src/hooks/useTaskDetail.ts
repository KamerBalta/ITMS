import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import {
    commentsApi,
    attachmentsApi,
    checklistApi,
    watchersApi,
    workLogsApi,
    labelsApi,
} from '../api/taskDetail';

export function useTaskDetail(taskId: string | null) {
    return useQuery({
        queryKey: ['task', taskId],
        queryFn: () => tasksApi.getById(taskId!),
        enabled: !!taskId,
        retry: false, // 403/404'te tekrar denemesin -- hemen hata durumuna geçsin
    });
}

export function useUpdateTaskTitle(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (title: string) => tasksApi.updateTitle(taskId, title),
        onSuccess: () => invalidateTask(qc, taskId),
    });
}

export function useUpdateTaskDescription(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (description: string) => tasksApi.updateDescription(taskId, description),
        onSuccess: () => invalidateTask(qc, taskId),
    });
}

export function useUpdateTaskPriority(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (priority: number) => tasksApi.updatePriority(taskId, priority),
        onSuccess: () => invalidateTask(qc, taskId),
    });
}

export function useUpdateTaskStoryPoint(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (storyPoint: number | null) => tasksApi.updateStoryPoint(taskId, storyPoint),
        onSuccess: () => invalidateTask(qc, taskId),
    });
}

export function useUpdateTaskDueDate(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dueDate: string | null) => tasksApi.updateDueDate(taskId, dueDate),
        onSuccess: () => invalidateTask(qc, taskId),
    });
}
export function useUpdateTaskRelease(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (releaseId: string | null) => tasksApi.updateRelease(taskId, releaseId),
        onSuccess: () => invalidateTask(qc, taskId),
    });
}

export function useUpdateTaskStatus(projectId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({
            taskId,
            status,
        }: {
            taskId: string;
            status: number;
        }) => tasksApi.updateStatus(taskId, status),

        onSuccess: (_, variables) => {
            invalidateTask(qc, variables.taskId);

            qc.invalidateQueries({
                queryKey: ['backlog', projectId],
            });

            qc.invalidateQueries({
                queryKey: ['board', projectId],
            });
        },
    });
}

export function useReassignTaskDetail(taskId: string, projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (assigneeId: string | null) => tasksApi.reassign(taskId, assigneeId),
        onSuccess: () => {
            invalidateTask(qc, taskId);
            qc.invalidateQueries({ queryKey: ['dashboard', 'workload', projectId] });
        },
    });
}

export function useCloseEpic(taskId: string, projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => tasksApi.closeEpic(taskId),
        onSuccess: () => {
            invalidateTask(qc, taskId);
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
}

function invalidateTask(queryClient: ReturnType<typeof useQueryClient>, taskId: string) {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
}

// --- Comments ---
export function useComments(taskId: string) {
    return useQuery({ queryKey: ['comments', taskId], queryFn: () => commentsApi.getAll(taskId) });
}

export function useAddComment(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (content: string) => commentsApi.add(taskId, content),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['comments', taskId] });
            invalidateTask(qc, taskId);
        },
    });
}

export function useUpdateComment(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
            commentsApi.update(taskId, commentId, content),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
    });
}

export function useDeleteComment(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (commentId: string) => commentsApi.delete(taskId, commentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['comments', taskId] });
            invalidateTask(qc, taskId);
        },
    });
}

// --- Attachments ---
export function useAttachments(taskId: string) {
    return useQuery({ queryKey: ['attachments', taskId], queryFn: () => attachmentsApi.getAll(taskId) });
}

export function useUploadAttachment(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => attachmentsApi.upload(taskId, file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['attachments', taskId] });
            invalidateTask(qc, taskId);
        },
    });
}

export function useDeleteAttachment(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (attachmentId: string) => attachmentsApi.delete(taskId, attachmentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['attachments', taskId] });
            invalidateTask(qc, taskId);
        },
    });
}

// --- Checklist ---
export function useChecklist(taskId: string) {
    return useQuery({ queryKey: ['checklist', taskId], queryFn: () => checklistApi.getAll(taskId) });
}

export function useAddChecklistItem(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (itemText: string) => checklistApi.add(taskId, itemText),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['checklist', taskId] });
            invalidateTask(qc, taskId);
        },
    });
}

export function useToggleChecklistItem(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (itemId: string) => checklistApi.toggle(taskId, itemId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['checklist', taskId] });
            invalidateTask(qc, taskId);
        },
    });
}

export function useDeleteChecklistItem(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (itemId: string) => checklistApi.delete(taskId, itemId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['checklist', taskId] });
            invalidateTask(qc, taskId);
        },
    });
}

// --- Watchers ---
export function useWatchers(taskId: string) {
    return useQuery({ queryKey: ['watchers', taskId], queryFn: () => watchersApi.getAll(taskId) });
}

export function useToggleWatch(taskId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (isWatching: boolean) =>
            isWatching
                ? watchersApi.remove(taskId)
                : watchersApi.add(taskId),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ['watchers', taskId] });
            await qc.invalidateQueries({ queryKey: ['task', taskId] });

            await qc.refetchQueries({ queryKey: ['watchers', taskId] });
            await qc.refetchQueries({ queryKey: ['task', taskId] });
        },
    });
}

// --- WorkLogs ---
export function useWorkLogs(taskId: string) {
    return useQuery({ queryKey: ['worklogs', taskId], queryFn: () => workLogsApi.getAll(taskId) });
}

export function useAddWorkLog(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ minutes, description }: { minutes: number; description?: string }) =>
            workLogsApi.add(taskId, minutes, description),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['worklogs', taskId] }),
    });
}

export function useDeleteWorkLog(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (workLogId: string) => workLogsApi.delete(taskId, workLogId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['worklogs', taskId] }),
    });
}

// --- Labels ---
export function useAllLabels() {
    return useQuery({ queryKey: ['labels'], queryFn: labelsApi.getAll });
}

export function useAddLabelToTask(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (labelId: string) => labelsApi.addToTask(taskId, labelId),
        onSuccess: () => invalidateTask(qc, taskId),
    });
}

export function useRemoveLabelFromTask(taskId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (labelId: string) => labelsApi.removeFromTask(taskId, labelId),
        onSuccess: () => invalidateTask(qc, taskId),
    });
}
export function useCreateSubtask(parentTaskId: string, projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { title: string; assigneeId?: string | null }) => tasksApi.createSubtask(parentTaskId, data),
        onSuccess: () => {
            invalidateTask(qc, parentTaskId);
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
}