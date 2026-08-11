import { useState } from 'react';
import {
    useChecklist,
    useAddChecklistItem,
    useToggleChecklistItem,
    useDeleteChecklistItem,
} from '../../../hooks/useTaskDetail';

export function ChecklistSection({ taskId }: { taskId: string }) {
    const { data } = useChecklist(taskId);
    const addItem = useAddChecklistItem(taskId);
    const toggleItem = useToggleChecklistItem(taskId);
    const deleteItem = useDeleteChecklistItem(taskId);
    const [newItemText, setNewItemText] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        await addItem.mutateAsync(newItemText);
        setNewItemText('');
    };

    const progress = data && data.totalCount > 0 ? Math.round((data.doneCount / data.totalCount) * 100) : 0;

    return (
        <div className="surface border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-primary">Checklist</h2>
                {data && data.totalCount > 0 && (
                    <span className="text-xs text-muted">
                        {data.doneCount}/{data.totalCount} ({progress}%)
                    </span>
                )}
            </div>

            {data && data.totalCount > 0 && (
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                    <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            )}

            <ul className="space-y-1 mb-3">
                {data?.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-sm text-secondary">
                        <input
                            type="checkbox"
                            checked={item.isDone}
                            onChange={() => toggleItem.mutate(item.id)}
                            className="rounded cursor-pointer"
                        />
                        <span className={item.isDone ? 'line-through text-muted' : ''}>{item.itemText}</span>
                        <button
                            onClick={() => deleteItem.mutate(item.id)}
                            className="ml-auto text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer"
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>

            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    type="text"
                    placeholder="Yeni madde ekle..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="flex-1 input-base border rounded px-3 py-1.5 text-sm"
                />
                <button type="submit" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap cursor-pointer">
                    Ekle
                </button>
            </form>
        </div>
    );
}