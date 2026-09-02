import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changelogApi } from '../api/changelog';

export function useUnseenChangelog() {
    return useQuery({ queryKey: ['changelog-unseen'], queryFn: changelogApi.getUnseen, staleTime: 60_000 });
}
export function useAllChangelog() {
    return useQuery({ queryKey: ['changelog-all'], queryFn: changelogApi.getAll });
}
export function useMarkChangelogSeen() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: changelogApi.markSeen, onSuccess: () => qc.invalidateQueries({ queryKey: ['changelog-unseen'] }) });
}
export function useCreateChangelogEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { title: string; description: string; category: string }) => changelogApi.create(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['changelog-unseen'] }); qc.invalidateQueries({ queryKey: ['changelog-all'] }); },
    });
}