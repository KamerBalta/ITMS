import * as signalR from '@microsoft/signalr';
import { getStoredAccessToken } from '../store/authStore';

let connection: signalR.HubConnection | null = null;
let currentProjectId: string | null = null;

const HUB_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:5148/api/v1').replace('/api/v1', '')}/hubs/project`;

export function getRealtimeConnection(): signalR.HubConnection {
    if (!connection) {
        connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => getStoredAccessToken() ?? '',
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();
    }
    return connection;
}

export async function joinProjectGroup(projectId: string) {
    const conn = getRealtimeConnection();

    if (conn.state === signalR.HubConnectionState.Disconnected) {
        await conn.start();
    }

    // Onceki proje grubundan ayril, yeniye katil -- tek anlik ayni anda 2 proje dinlemeyelim
    if (currentProjectId && currentProjectId !== projectId) {
        try {
            await conn.invoke('LeaveProject', currentProjectId);
        } catch {
            // baglanti zaten kopmus olabilir, sessizce gec
        }
    }

    if (currentProjectId !== projectId) {
        await conn.invoke('JoinProject', projectId);
        currentProjectId = projectId;
    }
}

export function disconnectRealtime() {
    connection?.stop();
    connection = null;
    currentProjectId = null;
}