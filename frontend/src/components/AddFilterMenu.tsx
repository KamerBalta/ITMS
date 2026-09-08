import { useState } from 'react';
import type { FilterField } from '../types/filterCriteria';
import { FILTER_FIELD_LABELS } from '../types/filterCriteria';

interface AddFilterMenuProps {
    onSelectField: (field: FilterField) => void;
    excludeFields?: FilterField[]; // zaten eklenmis alanlari tekrar gostermemek icin (opsiyonel -- ayni alandan birden fazla da eklenebilir istenirse)
}

const ALL_FIELDS: FilterField[] = ['status', 'assignee', 'reporter', 'priority', 'issueType', 'sprint', 'label', 'component', 'created', 'dueDate', 'updated'];

export function AddFilterMenu({ onSelectField }: AddFilterMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="text-sm border border-dashed border-gray-300 dark:border-gray-600 text-secondary rounded px-3 py-1.5 hover-surface"
            >
                + Filtre Ekle
            </button>
            {isOpen && (
                <div className="absolute z-20 top-full mt-1 left-0 surface border rounded-lg shadow-lg w-48 max-h-64 overflow-y-auto">
                    {ALL_FIELDS.map((field) => (
                        <button
                            key={field}
                            onClick={() => { onSelectField(field); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950 text-secondary"
                        >
                            {FILTER_FIELD_LABELS[field]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}