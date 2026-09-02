import { useState } from 'react';

export interface MultiSelectItem {
    id: string;
    name: string;
}

interface MultiSelectSearchProps {
    label: string;
    items: MultiSelectItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onCreate?: (name: string) => Promise<MultiSelectItem>; // verilirse "+ oluştur" secenegi acilir
    placeholder?: string;
}

export function MultiSelectSearch({ label, items, selectedIds, onToggle, onCreate, placeholder }: MultiSelectSearchProps) {
    const [query, setQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    const filteredItems = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
    const exactMatchExists = items.some((i) => i.name.toLowerCase() === query.trim().toLowerCase());

    const handleCreate = async () => {
        if (!onCreate || !query.trim() || exactMatchExists) return;
        setIsCreating(true);
        try {
            const newItem = await onCreate(query.trim());
            onToggle(newItem.id);
            setQuery('');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div>
            <p className="text-xs text-secondary mb-1">{label}</p>

            {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedItems.map((item) => (
                        <span key={item.id} className="text-xs px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center gap-1">
                            {item.name}
                            <button type="button" onClick={() => onToggle(item.id)} className="hover:text-teal-900 dark:hover:text-teal-100">
                                ✕
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder ?? 'Aramak için yazın...'}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    className="w-full input-base border rounded px-3 py-2 text-sm"
                />

                {showDropdown && (query || filteredItems.length > 0) && (
                    <div className="absolute z-10 top-full mt-1 left-0 right-0 surface border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onToggle(item.id)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center justify-between"
                            >
                                <span className="text-secondary">{item.name}</span>
                                {selectedIds.includes(item.id) && <span className="text-teal-600 dark:text-teal-400">✓</span>}
                            </button>
                        ))}
                        {filteredItems.length === 0 && !onCreate && (
                            <p className="px-3 py-2 text-xs text-muted">Sonuç bulunamadı.</p>
                        )}
                        {onCreate && query.trim() && !exactMatchExists && (
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="w-full text-left px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 border-t border-gray-100 dark:border-gray-800"
                            >
                                {isCreating ? 'Oluşturuluyor...' : `+ "${query.trim()}" oluştur ve ekle`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}