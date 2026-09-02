import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';

export function useProjects() {
    return useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll });
}

export function useProjectDetail(projectId: string | null) {
    return useQuery({
        queryKey: ['projects', projectId],
        queryFn: () => projectsApi.getById(projectId!),
        enabled: !!projectId,
        retry: false,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectsApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useUpdateProject(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            name: string;
            description?: string;
            startDate?: string | null;
            endDate?: string | null;
        }) => projectsApi.update(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });
}

export function useArchiveProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectsApi.archive,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useUnarchiveProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectsApi.unarchive,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useAddTeamToProject(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (teamId: string) => projectsApi.addTeam(projectId, teamId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });
}

export function useRemoveTeamFromProject(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (teamId: string) => projectsApi.removeTeam(projectId, teamId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });
}

export function useDeleteProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (projectId: string) => projectsApi.delete(projectId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useRequestProjectAccess() {
    return useMutation({
        mutationFn: ({
            projectId,
            message,
        }: {
            projectId: string;
            message?: string;
        }) => projectsApi.requestAccess(projectId, message),
    });
}