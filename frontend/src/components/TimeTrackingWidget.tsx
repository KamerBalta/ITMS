import { useState } from 'react';
import { useUpdateTaskEstimates } from '../hooks/useTaskDetail';
import { useWorkLogs } from '../hooks/useTaskDetail';

function formatMinutes(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}dk`;
    return m === 0 ? `${h}sa` : `${h}sa ${m}dk`;
}

function parseToMinutes(input: string): number | null {
    // "3h 30m", "3s 30d", "90" (dakika) gibi basit formatlari destekler
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) return Number(trimmed);

    const hourMatch = trimmed.match(/(\d+)\s*(sa|h)/i);
    const minMatch = trimmed.match(/(\d+)\s*(dk|m)/i);
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const mins = minMatch ? Number(minMatch[1]) : 0;
    return hours * 60 + mins || null;
}

export function TimeTrackingWidget({
    taskId,
    originalEstimateMinutes,
    remainingEstimateMinutes,
    canEdit,
}: {
    taskId: string;
    originalEstimateMinutes: number | null;
    remainingEstimateMinutes: number | null;
    canEdit: boolean;
}) {
    const { data: workLogSummary } = useWorkLogs(taskId);
    const updateEstimates = useUpdateTaskEstimates(taskId);

    const [isEditing, setIsEditing] = useState(false);
    const [originalDraft, setOriginalDraft] = useState('');
    const [remainingDraft, setRemainingDraft] = useState('');

    const loggedMinutes = workLogSummary?.totalMinutes ?? 0;

    if (!originalEstimateMinutes && !remainingEstimateMinutes && !canEdit) return null;

    const startEditing = () => {
        setOriginalDraft(originalEstimateMinutes?.toString() ?? '');
        setRemainingDraft(remainingEstimateMinutes?.toString() ?? '');
        setIsEditing(true);
    };

    const handleSave = async () => {
        await updateEstimates.mutateAsync({
            originalEstimateMinutes: originalDraft ? Number(originalDraft) : null,
            remainingEstimateMinutes: remainingDraft ? Number(remainingDraft) : null,
        });

        setIsEditing(false);
    };

    const total = originalEstimateMinutes ?? (remainingEstimateMinutes ?? 0) + loggedMinutes;
    const progressPct = total > 0 ? Math.min(100, Math.round((loggedMinutes / total) * 100)) : 0;

    return (
        <div className="surface border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-primary">Zaman Takibi</h2>
                {canEdit && !isEditing && (
                    <button onClick={startEditing} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        Düzenle
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-2">
                    <div>
                        <label className="text-xs text-muted">Orijinal Tahmin (örn. 90 ya da "1sa 30dk")</label>
                        <input value={originalDraft} onChange={(e) => setOriginalDraft(e.target.value)} className="w-full input-base border rounded px-2 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs text-muted">Kalan Tahmin</label>
                        <input value={remainingDraft} onChange={(e) => setRemainingDraft(e.target.value)} className="w-full input-base border rounded px-2 py-1.5 text-sm mt-1" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">
                            Kaydet
                        </button>
                        <button onClick={() => setIsEditing(false)} className="text-sm border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded text-secondary">
                            İptal
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-secondary">
                        <div>
                            <p className="text-muted">Harcanan</p>
                            <p className="font-medium text-primary">{formatMinutes(loggedMinutes)}</p>
                        </div>
                        <div>
                            <p className="text-muted">Kalan</p>
                            <p className="font-medium text-primary">{remainingEstimateMinutes !== null ? formatMinutes(remainingEstimateMinutes) : '-'}</p>
                        </div>
                        <div>
                            <p className="text-muted">Orijinal</p>
                            <p className="font-medium text-primary">{originalEstimateMinutes !== null ? formatMinutes(originalEstimateMinutes) : '-'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}