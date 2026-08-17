import { useState } from 'react';
import { useComponents } from '../../../hooks/useComponents';
import { useAddComponentToTask, useRemoveComponentFromTask } from '../../../hooks/useComponents';

interface TaskComponentItem {
    id: string;
    name: string;
    leadUserId: string | null;
    leadUserName: string | null;
}

export function ComponentsSection({
    taskId,
    projectId,
    currentComponents,
}: {
    taskId: string;
    projectId: string;
    currentComponents: TaskComponentItem[];
}) {
    const { data: allComponents } = useComponents(projectId);
    const addComponent = useAddComponentToTask(taskId);
    const removeComponent = useRemoveComponentFromTask(taskId);
    const [selectedId, setSelectedId] = useState('');

    if (!allComponents || allComponents.length === 0) return null;

    const available = allComponents.filter((c) => !currentComponents.some((cc) => cc.id === c.id));

    const handleAdd = async () => {
        if (!selectedId) return;
        await addComponent.mutateAsync(selectedId);
        setSelectedId('');
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {currentComponents.map((c) => (
                <span
                    key={c.id}
                    title={c.leadUserName ? `Sorumlu: ${c.leadUserName}` : undefined}
                    className="text-xs px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center gap-1"
                >
                    {c.name}
                    <button onClick={() => removeComponent.mutate(c.id)} className="hover:text-teal-900 dark:hover:text-teal-100">
                        ✕
                    </button>
                </span>
            ))}

            {available.length > 0 && (
                <div className="flex items-center gap-1">
                    <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="text-xs input-base border rounded px-2 py-1">
                        <option value="">Component ekle...</option>
                        {available.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button onClick={handleAdd} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        Ekle
                    </button>
                </div>
            )}
        </div>
    );
}