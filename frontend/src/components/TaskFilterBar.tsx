import type { ProjectMemberItem } from '../types/projectMember';
import { PRIORITY_LABELS } from '../types/task';
import type { TaskFilters } from '../hooks/useTaskFilters';
import { useAllLabels } from '../hooks/useTaskDetail';
import { useComponents } from '../hooks/useComponents';
import { useProjectStore } from '../store/projectStore';

interface TaskFilterBarProps {
    filters: TaskFilters & {
        setSearch: (v: string) => void;
        setOnlyMine: (v: boolean) => void;
        setTeamId: (v: string) => void;
        setPriority: (v: string) => void;
        setLabelId: (v: string) => void;
        setComponentId: (v: string) => void;
        setDueDate: (v: string) => void;
        reset: () => void;
    };
    members?: ProjectMemberItem[];
}

export function TaskFilterBar({ filters, members }: TaskFilterBarProps) {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const { data: labels } = useAllLabels();
    const { data: components } = useComponents(selectedProjectId);

    const uniqueTeams = Array.from(
        new Map(
            (members ?? []).map((m) => [m.teamId, m.teamName])
        ).entries()
    );

    const hasActiveFilters =
        filters.search ||
        filters.onlyMine ||
        filters.teamId ||
        filters.priority ||
        filters.labelId ||
        filters.componentId ||
        filters.dueDate;

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
                className={`text-sm px-3 py-1.5 rounded border whitespace-nowrap ${filters.onlyMine
                        ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-600 text-secondary'
                    }`}
            >
                Yalnızca Benim Görevlerim
            </button>

            <select
                value={filters.teamId}
                onChange={(e) => filters.setTeamId(e.target.value)}
                className="input-base border rounded px-3 py-1.5 text-sm"
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
                className="input-base border rounded px-3 py-1.5 text-sm"
            >
                <option value="">Tüm Öncelikler</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>

            <select
                value={filters.labelId}
                onChange={(e) => filters.setLabelId(e.target.value)}
                className="input-base border rounded px-3 py-1.5 text-sm"
            >
                <option value="">Tüm Etiketler</option>
                {labels?.map((l) => (
                    <option key={l.id} value={l.id}>
                        {l.name}
                    </option>
                ))}
            </select>

            {components && components.length > 0 && (
                <select
                    value={filters.componentId}
                    onChange={(e) => filters.setComponentId(e.target.value)}
                    className="input-base border rounded px-3 py-1.5 text-sm"
                >
                    <option value="">Tüm Component'ler</option>
                    {components.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            )}

            <select
                value={filters.dueDate}
                onChange={(e) => filters.setDueDate(e.target.value)}
                className="input-base border rounded px-3 py-1.5 text-sm"
            >
                <option value="">Due Date: Tümü</option>
                <option value="overdue">Gecikmiş</option>
                <option value="today">Bugün</option>
                <option value="tomorrow">Yarın</option>
                <option value="next7days">Önümüzdeki 7 Gün</option>
                <option value="noDueDate">Due Date Yok</option>
            </select>

            {hasActiveFilters && (
                <button
                    onClick={filters.reset}
                    className="text-xs text-muted hover:text-red-500 whitespace-nowrap"
                >
                    Filtreleri Temizle
                </button>
            )}
        </div>
    );
}