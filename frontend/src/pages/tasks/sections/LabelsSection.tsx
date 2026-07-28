import { useState } from 'react';
import { useAllLabels, useAddLabelToTask, useRemoveLabelFromTask } from '../../../hooks/useTaskDetail';

export function LabelsSection({ taskId, currentLabels }: { taskId: string; currentLabels: string[] }) {
    const { data: allLabels } = useAllLabels();
    const addLabel = useAddLabelToTask(taskId);
    const removeLabel = useRemoveLabelFromTask(taskId);
    const [selectedLabelId, setSelectedLabelId] = useState('');

    const availableLabels = allLabels?.filter((l) => !currentLabels.includes(l.name)) ?? [];

    const handleAdd = async () => {
        if (!selectedLabelId) return;
        await addLabel.mutateAsync(selectedLabelId);
        setSelectedLabelId('');
    };

    const handleRemove = async (labelName: string) => {
        const label = allLabels?.find((l) => l.name === labelName);
        if (label) await removeLabel.mutateAsync(label.id);
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {currentLabels.map((labelName) => (
                <span
                    key={labelName}
                    className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1"
                >
                    {labelName}
                    <button onClick={() => handleRemove(labelName)} className="hover:text-purple-900">
                        ✕
                    </button>
                </span>
            ))}

            {availableLabels.length > 0 && (
                <div className="flex items-center gap-1">
                    <select
                        value={selectedLabelId}
                        onChange={(e) => setSelectedLabelId(e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                    >
                        <option value="">Etiket ekle...</option>
                        {availableLabels.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.name}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleAdd} className="text-xs text-indigo-600 hover:underline">
                        Ekle
                    </button>
                </div>
            )}
        </div>
    );
}