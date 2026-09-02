import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTaskLinks, useCreateTaskLink, useDeleteTaskLink } from '../../../hooks/useTaskLinks';
import { useTasks } from '../../../hooks/useTasks';
import { LINK_TYPE_LABELS } from '../../../types/taskLink';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../../types/api';

const STATUS_COLORS: Record<string, string> = {
    ToDo: 'bg-gray-100 dark:bg-gray-700 text-secondary',
    InProgress: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    ReadyForReview: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
    ReadyForQA: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    Done: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    Closed: 'bg-gray-200 dark:bg-gray-700 text-muted',
};

export function TaskLinksSection({ taskId, projectId }: { taskId: string; projectId: string }) {
    const { data: links } = useTaskLinks(taskId);
    const { data: candidateTasks } = useTasks(projectId);
    const createLink = useCreateTaskLink(taskId);
    const deleteLink = useDeleteTaskLink(taskId);

    const [isAdding, setIsAdding] = useState(false);
    const [linkType, setLinkType] = useState('Blocks');
    const [targetTaskId, setTargetTaskId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!targetTaskId) return;
        setError(null);
        try {
            await createLink.mutateAsync({ targetTaskId, linkType });
            setTargetTaskId('');
            setIsAdding(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'İlişki eklenemedi.');
        }
    };

    const availableTasks = (candidateTasks ?? []).filter(
        (t) => t.id !== taskId && !links?.some((l) => l.relatedTaskId === t.id)
    );

    return (
        <div className="surface border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-primary">İlişkili Görevler</h2>
                <button onClick={() => setIsAdding((v) => !v)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    {isAdding ? 'Vazgeç' : '+ İlişki Ekle'}
                </button>
            </div>

            {!links || links.length === 0 ? (
                <p className="text-sm text-muted mb-2">Henüz ilişkili görev yok.</p>
            ) : (
                <ul className="space-y-1.5 mb-2">
                    {links.map((l) => (
                        <li key={l.linkId} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-muted whitespace-nowrap">
                                    {LINK_TYPE_LABELS[l.linkType]?.[l.direction] ?? l.linkType}
                                </span>
                                <Link to={`/tasks/${l.relatedTaskId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline truncate">
                                    {l.relatedIssueKey} — {l.relatedTaskTitle}
                                </Link>
                                <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${STATUS_COLORS[l.relatedStatus] ?? ''}`}>
                                    {l.relatedStatus}
                                </span>
                            </div>
                            <button onClick={() => deleteLink.mutate(l.linkId)} className="text-xs text-red-400 hover:text-red-600 shrink-0">
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {isAdding && (
                <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <select value={linkType} onChange={(e) => setLinkType(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm">
                        <option value="Blocks">Engelliyor (Blocks)</option>
                        <option value="RelatesTo">İlişkili (Relates to)</option>
                        <option value="Duplicates">Kopyası (Duplicates)</option>
                    </select>
                    <select value={targetTaskId} onChange={(e) => setTargetTaskId(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm">
                        <option value="">Görev seçin...</option>
                        {availableTasks.map((t) => (
                            <option key={t.id} value={t.id}>{t.issueKey} — {t.title}</option>
                        ))}
                    </select>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <button onClick={handleAdd} className="w-full bg-indigo-600 text-white py-1.5 rounded text-sm hover:bg-indigo-700">
                        Ekle
                    </button>
                </div>
            )}
        </div>
    );
}