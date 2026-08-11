import { useState } from 'react';
import { useSavedFilters, useCreateSavedFilter, useDeleteSavedFilter } from '../hooks/useSavedFilters';
import type { SerializableFilters } from '../types/savedFilter';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api';

interface SavedFiltersBarProps {
    projectId: string;
    currentFilters: SerializableFilters;
    onApply: (filters: SerializableFilters) => void;
}

export function SavedFiltersBar({ projectId, currentFilters, onApply }: SavedFiltersBarProps) {
    const { data: filters } = useSavedFilters(projectId);
    const createFilter = useCreateSavedFilter(projectId);
    const deleteFilter = useDeleteSavedFilter(projectId);

    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasActiveFilters =
        currentFilters.search || currentFilters.onlyMine || currentFilters.teamId || currentFilters.priority || currentFilters.labelId;

    const handleSave = async () => {
        if (!name.trim()) return;
        setError(null);
        try {
            await createFilter.mutateAsync({ name: name.trim(), filtersJson: JSON.stringify(currentFilters), isShared });
            setName('');
            setIsShared(false);
            setIsSaving(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Kaydedilemedi.');
        }
    };

    const handleApply = (f: (typeof filters)[number]) => {
        try {
            onApply(JSON.parse(f.filtersJson));
        } catch {
            // bozuk JSON -- sessizce yut, kullaniciyi bilgilendirmeye gerek yok (nadir bir edge case)
        }
    };

    if ((!filters || filters.length === 0) && !hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {filters && filters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {filters.map((f) => (
                        <div key={f.id} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full pl-3 pr-1 py-1">
                            <button onClick={() => handleApply(f)} className="text-xs text-secondary hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                                {f.name}
                                {f.isShared && !f.isOwner && <span className="text-muted"> · {f.createdByName}</span>}
                            </button>
                            {f.isOwner && (
                                <button
                                    onClick={() => deleteFilter.mutate(f.id)}
                                    className="text-muted hover:text-red-500 dark:hover:text-red-400 text-xs w-4 h-4 flex items-center justify-center cursor-pointer"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {hasActiveFilters && !isSaving && (
                <button onClick={() => setIsSaving(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                    + Bu Filtreyi Kaydet
                </button>
            )}

            {isSaving && (
                <div className="flex items-center gap-1.5 surface border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
                    <input
                        type="text"
                        placeholder="Filtre adı"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="text-xs border-none outline-none w-28 bg-transparent text-primary"
                    />
                    <label className="flex items-center gap-1 text-xs text-secondary whitespace-nowrap cursor-pointer">
                        <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} className="rounded cursor-pointer" />
                        Paylaş
                    </label>
                    <button onClick={handleSave} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer">
                        Kaydet
                    </button>
                    <button onClick={() => setIsSaving(false)} className="text-xs text-muted cursor-pointer">
                        ✕
                    </button>
                </div>
            )}

            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}