import { useQueries } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { useProjects } from './useProjects';
import { useAuthStore } from '../store/authStore';

export interface MyWorkItem {
    id: string;
    title: string;
    issueType: string;
    priority: string;
    status: string;
    statusId: string; // <-- Dinamik workflow ve statü eşleştirmesi için eklendi
    storyPoint: number | null;
    projectId: string;
    projectName: string;
}

export function useMyWork() {
    const { data: projects } = useProjects();
    const currentUser = useAuthStore((state) => state.user);

    const queries = useQueries({
        queries: (projects ?? []).map((p) => ({
            queryKey: ['tasks', p.id, { assigneeId: currentUser?.userId }],
            queryFn: () => tasksApi.getAll({ projectId: p.id, assigneeId: currentUser?.userId, pageSize: 100 }),
            enabled: !!currentUser?.userId,
        })),
    });

    const isLoading = queries.some((q) => q.isLoading);

    const items: MyWorkItem[] = queries.flatMap((q, i) => {
        const project = projects?.[i];
        if (!q.data || !project) return [];
        return q.data.map((t) => ({
            id: t.id,
            title: t.title,
            issueType: t.issueType,
            priority: t.priority,
            status: t.status,
            statusId: t.statusId,
            storyPoint: t.storyPoint,
            projectId: project.id,
            projectName: project.name,
        }));
    });

    return { items, isLoading };
}