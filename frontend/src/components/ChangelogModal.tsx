import { Modal } from './Modal';
import { useUnseenChangelog, useMarkChangelogSeen } from '../hooks/useChangelog';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
    Feature: { label: 'Yeni', color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' },
    Improvement: { label: 'İyileştirme', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
    Fix: { label: 'Düzeltme', color: 'bg-gray-100 dark:bg-gray-700 text-secondary' },
    BreakingChange: { label: 'Önemli Değişiklik', color: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300' },
};

export function ChangelogModal() {
    const { data: unseen } = useUnseenChangelog();
    const markSeen = useMarkChangelogSeen();

    if (!unseen || unseen.length === 0) return null;

    return (
        <Modal title="🎉 Yenilikler" isOpen onClose={() => markSeen.mutate()}>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                <p className="text-xs text-muted">Son girişinizden bu yana eklenen değişiklikler:</p>
                {unseen.map((entry) => {
                    const cat = CATEGORY_LABELS[entry.category] ?? CATEGORY_LABELS.Feature;
                    return (
                        <div key={entry.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                                <span className="text-sm font-medium text-primary">{entry.title}</span>
                            </div>
                            <p className="text-xs text-secondary">{entry.description}</p>
                        </div>
                    );
                })}
            </div>
            <button onClick={() => markSeen.mutate()} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 mt-3">
                Anladım
            </button>
        </Modal>
    );
}