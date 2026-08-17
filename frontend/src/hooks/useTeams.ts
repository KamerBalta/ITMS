import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '../api/teams';

export function useTeams() {
    return useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll });
}

export function useTeamDetail(teamId: string | null) {
    return useQuery({
        queryKey: ['teams', teamId],
        queryFn: () => teamsApi.getById(teamId!),
        enabled: !!teamId,
        retry: false,
    });
}

export function useCreateTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: teamsApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
    });
}

export function useUpdateTeam(teamId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string }) => teamsApi.update(teamId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
        },
    });
}

export function useAddTeamMember(teamId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { userId: string; teamRole: string }) => teamsApi.addMember(teamId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
        },
    });
}

export function useRemoveTeamMember(teamId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => teamsApi.removeMember(teamId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
        },
    });
}