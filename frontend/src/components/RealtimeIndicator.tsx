import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { getRealtimeConnection } from '../lib/realtimeConnection';

export function RealtimeIndicator() {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const conn = getRealtimeConnection();

        const updateStatus = () => setIsConnected(conn.state === signalR.HubConnectionState.Connected);

        conn.onreconnected(updateStatus);
        conn.onclose(updateStatus);
        conn.onreconnecting(updateStatus);

        const interval = setInterval(updateStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!isConnected) return null;

    return (
        <span className="flex items-center gap-1 text-xs text-green-600" title="Canlı güncellemeler aktif">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Canlı
        </span>
    );
}