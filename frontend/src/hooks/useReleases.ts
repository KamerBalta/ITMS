import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { releasesApi } from '../api/releases';

export function useReleases(projectId: string | null) {
    return useQuery({
        queryKey: ['releases', projectId],
        queryFn: () => releasesApi.getAll(projectId!),
        enabled: !!projectId,
    });
}

export function useCreateRelease(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { version: string; releaseDate?: string | null; description?: string }) =>
            releasesApi.create({ projectId, ...data }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['releases', projectId] }),
    });
}

export function useUpdateRelease(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ releaseId, data }: { releaseId: string; data: { releaseDate?: string | null; description?: string } }) =>
            releasesApi.update(releaseId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['releases', projectId] }),
    });
}

export function useReleaseTasks(releaseId: string | null) {
    return useQuery({
        queryKey: ['release-tasks', releaseId],
        queryFn: () => releasesApi.getTasksByRelease(releaseId!),
        enabled: !!releaseId,
    });
}