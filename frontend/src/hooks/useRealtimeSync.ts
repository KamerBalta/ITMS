import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjectStore } from '../store/projectStore';
import { getRealtimeConnection, joinProjectGroup } from '../lib/realtimeConnection';

interface ProjectUpdatePayload {
    entityType: 'task' | 'sprint' | 'comment';
    action: string;
    timestamp: string;
}

export function useRealtimeSync() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!selectedProjectId) return;

        let cancelled = false;

        joinProjectGroup(selectedProjectId).catch(() => {
            // Baglanti kurulamadi (orn. backend kapali) -- sessizce basarisiz ol, polling zaten yedek olarak calisiyor
        });

        const conn = getRealtimeConnection();

        const handler = (payload: ProjectUpdatePayload) => {
            if (cancelled) return;

            // Entity turune gore ilgili react-query cache'lerini gecersiz kil --
            // boylece bir sonraki render'da otomatik yeniden cekilir.
            switch (payload.entityType) {
                case 'task':
                    queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] });
                    queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
                    queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary', selectedProjectId] });
                    break;
                case 'sprint':
                    queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] });
                    queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] });
                    queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
                    break;
                case 'comment':
                    queryClient.invalidateQueries({ queryKey: ['comments'] });
                    queryClient.invalidateQueries({ queryKey: ['task'] });
                    break;
            }
        };

        conn.on('ProjectUpdated', handler);

        return () => {
            cancelled = true;
            conn.off('ProjectUpdated', handler);
        };
    }, [selectedProjectId, queryClient]);
}