import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectMembersApi } from '../api/projectMembers';

export function useProjectMembers(projectId: string | null) {
    return useQuery({
        queryKey: ['projectMembers', projectId],
        queryFn: () => projectMembersApi.getByProject(projectId!),
        enabled: !!projectId,
    });
}

export function useAddProjectMember(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { teamId: string; userId: string; projectRole: number }) =>
            projectMembersApi.add(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });
}

export function useRemoveProjectMember(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (memberId: string) => projectMembersApi.remove(projectId, memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });
}