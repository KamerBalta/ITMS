import { useState } from 'react';
import { useWorkLogs, useAddWorkLog, useDeleteWorkLog } from '../../../hooks/useTaskDetail';
import { useAuthStore } from '../../../store/authStore';

function formatMinutes(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

export function WorkLogsSection({ taskId }: { taskId: string }) {
    const currentUser = useAuthStore((state) => state.user);
    const { data } = useWorkLogs(taskId);
    const addWorkLog = useAddWorkLog(taskId);
    const deleteWorkLog = useDeleteWorkLog(taskId);

    const [minutes, setMinutes] = useState('');
    const [description, setDescription] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = Number(minutes);
        if (!value || value <= 0) return;
        await addWorkLog.mutateAsync({ minutes: value, description: description || undefined });
        setMinutes('');
        setDescription('');
    };

    return (
        <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Zaman Takibi</h2>
                {data && data.totalMinutes > 0 && (
                    <span className="text-xs text-gray-400">Toplam: {formatMinutes(data.totalMinutes)}</span>
                )}
            </div>

            <ul className="space-y-1 mb-3">
                {data?.items.map((log) => (
                    <li key={log.id} className="flex items-center justify-between text-sm">
                        <span>
                            <strong>{formatMinutes(log.timeSpentMinutes)}</strong> — {log.userName}
                            {log.description && <span className="text-gray-400"> · {log.description}</span>}
                        </span>
                        {log.userName === currentUser?.email && (
                            <button onClick={() => deleteWorkLog.mutate(log.id)} className="text-xs text-red-400 hover:text-red-600">
                                ✕
                            </button>
                        )}
                    </li>
                ))}
                {(!data || data.items.length === 0) && <p className="text-sm text-gray-400">Henüz zaman kaydı yok.</p>}
            </ul>

            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    type="number"
                    placeholder="Dakika"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    min={1}
                    className="w-24 border rounded px-3 py-1.5 text-sm"
                />
                <input
                    type="text"
                    placeholder="Açıklama (opsiyonel)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 border rounded px-3 py-1.5 text-sm"
                />
                <button type="submit" className="text-sm text-indigo-600 hover:underline whitespace-nowrap">
                    Ekle
                </button>
            </form>
        </div>
    );
}