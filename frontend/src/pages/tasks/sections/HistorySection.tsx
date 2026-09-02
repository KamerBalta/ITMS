import { useTaskAuditHistory } from '../../../hooks/useAuditHistory';

const FIELD_LABELS: Record<string, string> = {
    Title: 'Başlık',
    Description: 'Açıklama',
    Priority: 'Öncelik',
    StoryPoint: 'Story Point',
    DueDate: 'Teslim Tarihi',
    AssigneeId: 'Atanan Kişi',
};

export function HistorySection({ taskId }: { taskId: string }) {
    const { data: history, isLoading } = useTaskAuditHistory(taskId);

    if (isLoading) return null;
    if (!history || history.length === 0) return null;

    return (
        <details className="surface border rounded-lg p-4">
            <summary className="font-semibold text-primary cursor-pointer">Geçmiş ({history.length})</summary>
            <div className="mt-3 space-y-2">
                {history.map((h, i) => (
                    <div key={i} className="text-xs text-secondary border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                        <span className="font-medium text-primary">{h.userName}</span>{' '}
                        <span className="text-muted">{FIELD_LABELS[h.fieldName] ?? h.fieldName} alanını değiştirdi:</span>
                        <div className="mt-0.5">
                            <span className="line-through text-muted">{h.oldValue || '(boş)'}</span>
                            {' → '}
                            <span className="text-primary">{h.newValue || '(boş)'}</span>
                        </div>
                        <span className="text-muted">{new Date(h.timestamp).toLocaleString('tr-TR')}</span>
                    </div>
                ))}
            </div>
        </details>
    );
}