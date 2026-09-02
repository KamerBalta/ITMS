import { useState } from 'react';
import { useAllLabels, useAddLabelToTask, useRemoveLabelFromTask } from '../../../hooks/useTaskDetail';
import { useCreateLabel } from '../../../hooks/useLabels';

export function LabelsSection({ taskId, currentLabels }: { taskId: string; currentLabels: string[] }) {
    const { data: allLabels } = useAllLabels();
    const addLabel = useAddLabelToTask(taskId);
    const removeLabel = useRemoveLabelFromTask(taskId);
    const createLabel = useCreateLabel();

    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const availableLabels = (allLabels ?? []).filter(
        (l) => !currentLabels.includes(l.name) && l.name.toLowerCase().includes(query.toLowerCase())
    );
    const exactMatchExists = (allLabels ?? []).some((l) => l.name.toLowerCase() === query.trim().toLowerCase());

    const handleAddExisting = async (labelId: string) => {
        setError(null);
        try {
            await addLabel.mutateAsync(labelId);
            setQuery('');
            setShowSuggestions(false);
        } catch {
            setError('Etiket eklenemedi.');
        }
    };

    const handleCreateAndAdd = async () => {
        const name = query.trim();
        if (!name || exactMatchExists) return;
        setError(null);
        try {
            const result = await createLabel.mutateAsync({ name });
            await addLabel.mutateAsync(result.id);
            setQuery('');
            setShowSuggestions(false);
        } catch {
            setError('Etiket oluşturulamadı.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (exactMatchExists) {
                const match = allLabels!.find((l) => l.name.toLowerCase() === query.trim().toLowerCase())!;
                handleAddExisting(match.id);
            } else {
                handleCreateAndAdd();
            }
        }
    };

    const handleRemove = async (labelName: string) => {
        const label = allLabels?.find((l) => l.name === labelName);
        if (label) await removeLabel.mutateAsync(label.id);
    };

    return (
        <div className="flex items-center gap-2 flex-wrap relative">
            {currentLabels.map((labelName) => (
                <span key={labelName} className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                    {labelName}
                    <button onClick={() => handleRemove(labelName)} className="hover:text-purple-900 dark:hover:text-purple-100 cursor-pointer">
                        ✕
                    </button>
                </span>
            ))}

            <div className="relative">
                <input
                    type="text"
                    placeholder="+ Etiket ekle"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={handleKeyDown}
                    className="text-xs input-base border rounded-full px-2 py-1 w-32"
                />

                {showSuggestions && query && (
                    <div className="absolute z-10 top-full mt-1 left-0 surface border rounded-lg shadow-lg w-48 max-h-40 overflow-y-auto">
                        {availableLabels.map((l) => (
                            <button
                                key={l.id}
                                onClick={() => handleAddExisting(l.id)}
                                className="w-full text-left px-3 py-1.5 text-xs text-primary hover:bg-purple-50 dark:hover:bg-purple-950 cursor-pointer"
                            >
                                {l.name}
                            </button>
                        ))}
                        {!exactMatchExists && query.trim() && (
                            <button onClick={handleCreateAndAdd} className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 border-t border-gray-100 dark:border-gray-800 cursor-pointer">
                                + "{query.trim()}" oluştur ve ekle
                            </button>
                        )}
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
        </div>
    );
}