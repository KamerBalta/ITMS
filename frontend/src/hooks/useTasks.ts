import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import type { CreateTaskPayload, TaskListItem } from '../types/task';

export function useTasks(
    projectId: string | null,
    extraParams?: {
        boardId?: string;
        sprintId?: string | null;
        backlogOnly?: boolean;
        assigneeId?: string;
        status?: string;
        statusId?: string;
        issueTypeId?: string;
        priority?: number;
        labelId?: string;
        search?: string;
        parentTaskId?: string;
        unassignedOnly?: boolean;
        componentId?: string;
    }
) {
    return useQuery({
        queryKey: ['tasks', projectId, extraParams],
        queryFn: () => tasksApi.getAll({ projectId: projectId!, ...extraParams }),
        enabled: !!projectId,
    });
}

export function useResolveIssueKey(issueKey: string | null) {
    return useQuery({
        queryKey: ['resolve-issue-key', issueKey],
        queryFn: () => tasksApi.resolveIssueKey(issueKey!),
        enabled: !!issueKey,
        retry: false,
        staleTime: 5 * 60_000, // bir kere cozulen key, projenin omru boyunca degismez
    });
}

// #Perf: Bu iki fonksiyon artık kendi useTasks çağrısı YAPMIYOR -- dışarıdan (zaten
// çekilmiş) bir TaskListItem[] alıp filtreliyor. Böylece CreateTaskModal gibi aynı
// anda ikisine de ihtiyaç duyan bileşenler, TEK bir network isteğini paylaşabiliyor.
// SADECE Epic olan görevleri getirir
export function filterEpicCandidates(tasks: TaskListItem[] | undefined) {
    return tasks?.filter((t) => {
        const typeName = (t.issueType ?? '').toLowerCase();

        return (
            typeName === 'epic' ||
            (t.allowsChildren === true &&
                !t.requiresParent &&
                typeName !== 'story' &&
                typeName !== 'task' &&
                typeName !== 'bug')
        );
    });
}

// Sub-task için üst görev olabilecekler: Sadece Story, Task, Bug (Epic ve Sub-task hariç)
export function filterSubtaskParentCandidates(tasks: TaskListItem[] | undefined) {
    return tasks?.filter((t) => {
        const typeName = (t.issueType ?? '').toLowerCase();

        return (
            typeName !== 'epic' &&
            typeName !== 'subtask' &&
            typeName !== 'sub-task' &&
            !t.requiresParent
        );
    });
}

// Board gibi yerlerde hala tek başına çağrılabilecek, projeye özel tam liste çeken versiyon --
// ama artık yalnızca gerçekten gerekliyse (enabled=true) tetiklenir.
export function useProjectTasksForParentSelection(projectId: string | null, enabled: boolean) {
    return useQuery({
        queryKey: ['tasks', projectId, 'all-for-parent-selection'],
        queryFn: () => tasksApi.getAll({ projectId: projectId!, pageSize: 500 }),
        enabled: enabled && !!projectId,
        staleTime: 60_000,
    });
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
        mutationFn: ({ taskId, statusId }: { taskId: string; statusId: string }) =>
            tasksApi.updateStatus(taskId, statusId),

        // #10: Optimistic update -- backend cevap vermeden ÖNCE local cache'i güncelliyoruz,
        // böylece kart anında yeni kolona "zıplıyor" gibi görünür. Backend başarısız olursa
        // (onError) eski hali GERİ YÜKLÜYORUZ.
        onMutate: async ({ taskId, statusId }) => {
            await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });

            const previousQueries = queryClient.getQueriesData<TaskListItem[]>({
                queryKey: ['tasks', projectId],
            });

            queryClient.setQueriesData<TaskListItem[]>(
                { queryKey: ['tasks', projectId] },
                (old) => old?.map((t) => (t.id === taskId ? { ...t, statusId } : t))
            );

            return { previousQueries };
        },

        onError: (_err, _variables, context) => {
            // Başarısız olursa TÜM etkilenen query'leri eski haline geri yükle
            context?.previousQueries.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },

        onSettled: () => {
            // Başarılı ya da başarısız, sunucudaki gerçek veriyle senkron kalmak için
            // arka planda taze veriyi çek
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

export function useUpdateTaskEstimates(taskId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({
            original,
            remaining,
        }: {
            original: number | null;
            remaining: number | null;
        }) => tasksApi.updateEstimates(taskId, original, remaining),

        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['task', taskId] });
            qc.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}