import type { ProjectMemberItem } from '../types/projectMember';
import { PRIORITY_LABELS } from '../types/task';
import type { TaskFilters } from '../hooks/useTaskFilters';

interface TaskFilterBarProps {
    filters: TaskFilters & {
        setSearch: (v: string) => void;
        setOnlyMine: (v: boolean) => void;
        setTeamId: (v: string) => void;
        setPriority: (v: string) => void;
        reset: () => void;
    };
    members?: ProjectMemberItem[];
}

export function TaskFilterBar({ filters, members }: TaskFilterBarProps) {
    const uniqueTeams = Array.from(
        new Map((members ?? []).map((m) => [m.teamId, m.teamName])).entries()
    );

    const hasActiveFilters = filters.search || filters.onlyMine || filters.teamId || filters.priority;

    return (
        <div className="flex flex-wrap items-center gap-2 bg-white border rounded-lg p-2">
            <input
                type="text"
                placeholder="Görevlerde ara..."
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm flex-1 min-w-[160px]"
            />

            <button
                onClick={() => filters.setOnlyMine(!filters.onlyMine)}
                className={`text-sm px-3 py-1.5 rounded border whitespace-nowrap ${filters.onlyMine ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-200 text-gray-600'
                    }`}
            >
                Yalnızca Benim Görevlerim
            </button>

            <select
                value={filters.teamId}
                onChange={(e) => filters.setTeamId(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
            >
                <option value="">Tüm Takımlar</option>
                {uniqueTeams.map(([id, name]) => (
                    <option key={id} value={id}>
                        {name}
                    </option>
                ))}
            </select>

            <select
                value={filters.priority}
                onChange={(e) => filters.setPriority(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
            >
                <option value="">Tüm Öncelikler</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>

            {hasActiveFilters && (
                <button onClick={filters.reset} className="text-xs text-gray-400 hover:text-red-600 whitespace-nowrap">
                    Filtreleri Temizle
                </button>
            )}
        </div>
    );
}