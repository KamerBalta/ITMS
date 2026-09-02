import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjectStore } from '../store/projectStore';
import { getRealtimeConnection, joinProjectGroup } from '../lib/realtimeConnection';

interface ProjectUpdatePayload {
    entityType: 'task' | 'sprint' | 'comment' | 'board-columns';
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

            // Entity turune gore ilgili react-query cache'lerini gecersiz kil
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
                    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                    break;
                case 'comment':
                    // #Perf: yalnizca 'comments' cache'lerini gecersiz kil --
                    // onceden buraya tum 'tasks' (liste) sorgusu da dahildi, gereksiz yere Board/Backlog/
                    // IssueList'i de yeniden cekiyordu ama yorum eklenmesi bunlarin gorunumunu degistirmez.
                    queryClient.invalidateQueries({ queryKey: ['comments'] });
                    break;
                case 'board-columns':
                    // #8: Board Settings'te yapilan her degisiklik aninda Board'a ve Board Settings sayfasina yansir
                    queryClient.invalidateQueries({ queryKey: ['board-columns', selectedProjectId] });
                    queryClient.invalidateQueries({ queryKey: ['board-column-settings', selectedProjectId] });
                    queryClient.invalidateQueries({ queryKey: ['workflow-statuses', selectedProjectId] });
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