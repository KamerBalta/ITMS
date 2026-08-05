import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';

export function useSettings() {
    return useQuery({ queryKey: ['settings'], queryFn: settingsApi.getAll });
}

export function useUpsertSetting() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ key, value }: { key: string; value: string }) => settingsApi.upsert(key, value),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
    });
}

export function useDeleteSetting() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (settingId: string) => settingsApi.delete(settingId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
    });
}