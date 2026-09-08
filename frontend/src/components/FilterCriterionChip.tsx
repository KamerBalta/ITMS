import { useState } from 'react';
import type { ActiveFilterCriterion, FilterField } from '../types/filterCriteria';
import { FILTER_FIELD_LABELS } from '../types/filterCriteria';
import { PRIORITY_LABELS } from '../types/task';

interface ChipOption { value: string; label: string }

interface FilterCriterionChipProps {
    criterion: ActiveFilterCriterion;
    options: Partial<Record<FilterField, ChipOption[]>>;
    onChange: (id: string, value: string, label: string) => void;
    onRemove: (id: string) => void;
}

// Tarih alanlari icin basit bir "once/sonra" secici -- Jira'nin "was/changed" gibi
// karmasik operatorlerini degil, gercekte en cok kullanilan "X tarihinden sonra/once" kalibini destekler.
function DateCriterionEditor({ field, value, onChange }: { field: FilterField; value: string; onChange: (v: string, label: string) => void }) {
    const [direction, mode] = value.includes(':') ? value.split(':') : ['after', ''];
    const [date, setDate] = useState(mode || '');

    const apply = (dir: string, d: string) => {
        if (!d) return;
        const label = `${FILTER_FIELD_LABELS[field]}: ${dir === 'after' ? '≥' : '≤'} ${d}`;
        onChange(`${dir}:${d}`, label);
    };

    return (
        <div className="flex items-center gap-1">
            <select value={direction} onChange={(e) => { apply(e.target.value, date); }} className="text-xs input-base border rounded px-1 py-1">
                <option value="after">sonra</option>
                <option value="before">önce</option>
            </select>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); apply(direction, e.target.value); }} className="text-xs input-base border rounded px-1 py-1" />
        </div>
    );
}

export function FilterCriterionChip({ criterion, options, onChange, onRemove }: FilterCriterionChipProps) {
    const isDateField = criterion.field === 'created' || criterion.field === 'dueDate' || criterion.field === 'updated';
    const fieldOptions = options[criterion.field] ?? [];

    return (
        <div className="flex items-center gap-1 surface border rounded-full pl-3 pr-1 py-1">
            <span className="text-xs text-secondary whitespace-nowrap">{FILTER_FIELD_LABELS[criterion.field]}:</span>

            {isDateField ? (
                <DateCriterionEditor field={criterion.field} value={criterion.value} onChange={(v, label) => onChange(criterion.id, v, label)} />
            ) : criterion.field === 'priority' ? (
                <select
                    value={criterion.value}
                    onChange={(e) => onChange(criterion.id, e.target.value, `Priority: ${PRIORITY_LABELS[Number(e.target.value) as keyof typeof PRIORITY_LABELS]}`)}
                    className="text-xs input-base border-none bg-transparent"
                >
                    <option value="">Seçin...</option>
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            ) : (
                <select
                    value={criterion.value}
                    onChange={(e) => {
                        const opt = fieldOptions.find((o) => o.value === e.target.value);
                        onChange(criterion.id, e.target.value, `${FILTER_FIELD_LABELS[criterion.field]}: ${opt?.label ?? e.target.value}`);
                    }}
                    className="text-xs input-base border-none bg-transparent max-w-[140px]"
                >
                    <option value="">Seçin...</option>
                    {fieldOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            )}

            <button onClick={() => onRemove(criterion.id)} className="text-muted hover:text-red-500 text-xs w-4 h-4 flex items-center justify-center shrink-0">✕</button>
        </div>
    );
}