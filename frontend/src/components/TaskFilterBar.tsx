import type { ProjectMemberItem } from '../types/projectMember';
import { PRIORITY_LABELS } from '../types/task';
import type { TaskFilters } from '../hooks/useTaskFilters';
import { useAllLabels } from '../hooks/useTaskDetail';

interface TaskFilterBarProps {
    filters: TaskFilters & {
        setSearch: (v: string) => void;
        setOnlyMine: (v: boolean) => void;
        setTeamId: (v: string) => void;
        setPriority: (v: string) => void;
        labelId: string;
        setLabelId: (v: string) => void;
        reset: () => void;
    };
    members?: ProjectMemberItem[];
}

const PRIORITY_VALUES = {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical',
} as const;

export function TaskFilterBar({ filters, members }: TaskFilterBarProps) {
    const { data: labels } = useAllLabels();
    const uniqueTeams = Array.from(new Map((members ?? []).map((m) => [m.teamId, m.teamName])).entries());
    const hasActiveFilters = filters.search || filters.onlyMine || filters.teamId || filters.priority || filters.labelId;

    return (
        <div className="flex flex-wrap items-center gap-2 surface border rounded-lg p-2">
            <input
                type="text"
                placeholder="Görevlerde ara..."
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                className="input-base border rounded px-3 py-1.5 text-sm flex-1 min-w-[160px]"
            />
            <button
                onClick={() => filters.setOnlyMine(!filters.onlyMine)}
                className={`text-sm px-3 py-1.5 rounded border whitespace-nowrap cursor-pointer transition-colors ${filters.onlyMine
                        ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-600 text-secondary'
                    }`}
            >
                Yalnızca Benim Görevlerim
            </button>

            <select
                value={filters.priority}
                onChange={(e) => filters.setPriority(e.target.value)}
                className="input-base border rounded px-3 py-1.5 text-sm cursor-pointer"
            >
                <option value="">Tüm Öncelikler</option>
                {Object.entries(PRIORITY_VALUES).map(([value, priorityName]) => (
                    <option key={value} value={priorityName}>
                        {PRIORITY_LABELS[Number(value) as 0 | 1 | 2 | 3]}
                    </option>
                ))}
            </select>

            <select
                value={filters.labelId}
                onChange={(e) => filters.setLabelId(e.target.value)}
                className="input-base border rounded px-3 py-1.5 text-sm cursor-pointer"
            >
                <option value="">Tüm Etiketler</option>
                {labels?.map((l) => (
                    <option key={l.id} value={l.id}>
                        {l.name}
                    </option>
                ))}
            </select>

            {hasActiveFilters && (
                <button onClick={filters.reset} className="text-xs text-muted hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap cursor-pointer">
                    Filtreleri Temizle
                </button>
            )}
        </div>
    );
}