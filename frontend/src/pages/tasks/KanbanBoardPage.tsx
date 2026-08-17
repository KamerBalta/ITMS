import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useTasks, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useActiveSprint } from '../../hooks/useSprints';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { useAllLabels } from '../../hooks/useTaskDetail';
import { useBoardColumnSettings, useUpdateWipLimit } from '../../hooks/useBoardSettings';
import { TaskCard } from '../../components/TaskCard';
import { TaskFilterBar } from '../../components/TaskFilterBar';
import { AssigneeAvatarFilter } from '../../components/AssigneeAvatarFilter';
import { SavedFiltersBar } from '../../components/SavedFiltersBar';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { BOARD_COLUMNS, STATUS_TO_INT } from '../../lib/taskStatus';
import { colorForEpic } from '../../lib/groupByEpic';
import type { ItemStatus, TaskListItem } from '../../types/task';

const EPIC_GROUP_KEY = '__no_epic__';

export function KanbanBoardPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const currentUser = useAuthStore((state) => state.user);
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const { activeSprint } = useActiveSprint(selectedProjectId);
    const { data: tasks, isLoading } = useTasks(selectedProjectId, { sprintId: activeSprint?.id, backlogOnly: false });
    const { data: members } = useProjectMembers(selectedProjectId);
    const { data: labels } = useAllLabels();
    const { data: columnSettings } = useBoardColumnSettings(selectedProjectId);
    const updateWipLimit = useUpdateWipLimit(selectedProjectId ?? '');
    const updateStatus = useUpdateTaskStatus(selectedProjectId ?? '');
    const filters = useTaskFilters();

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<Set<string>>(new Set());
    const [dragOverColumn, setDragOverColumn] = useState<ItemStatus | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [swimlaneMode, setSwimlaneMode] = useState(false);
    const [editingWipFor, setEditingWipFor] = useState<ItemStatus | null>(null);
    const [wipDraft, setWipDraft] = useState('');

    const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
    const CARDS_PER_COLUMN_LIMIT = 30;

    const toggleColumnExpanded = (status: string) => {
        setExpandedColumns((prev) => {
            const next = new Set(prev);
            if (next.has(status)) next.delete(status);
            else next.add(status);
            return next;
        });
    };

    const toggleAssignee = (userId: string) => {
        setSelectedAssigneeIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    if (!selectedProjectId) {
        return <p className="text-muted p-4">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (!activeSprint) {
        return (
            <div className="text-center py-16">
                <p className="text-secondary font-medium">Bu projede aktif bir sprint yok.</p>
                <p className="text-sm text-muted mt-1">
                    Board'u kullanabilmek için önce Backlog sayfasından bir sprint başlatın.
                </p>
            </div>
        );
    }

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: ItemStatus) => {
        e.preventDefault();
        setDragOverColumn(null);
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        setStatusError(null);
        try {
            await updateStatus.mutateAsync({ taskId, status: STATUS_TO_INT[targetStatus] });
        } catch {
            setStatusError('Bu durum geçişine yetkiniz yok veya geçiş kuralına aykırı.');
            setTimeout(() => setStatusError(null), 4000);
        }
    };

    const filteredTasks = (tasks ?? []).filter((t) => {
        if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.priority && t.priority !== filters.priority) return false;
        if (filters.onlyMine && t.assigneeId !== currentUser?.userId) return false;
        if (filters.teamId) {
            const member = members?.find((m) => m.userId === t.assigneeId);
            if (member?.teamId !== filters.teamId) return false;
        }
        if (filters.labelId) {
            const labelName = labels?.find((l) => l.id === filters.labelId)?.name;
            if (!labelName || !t.labels.includes(labelName)) return false;
        }
        if (selectedAssigneeIds.size > 0) {
            if (!t.assigneeId || !selectedAssigneeIds.has(t.assigneeId)) return false;
        }
        return true;
    });

    // Normal board görünümünde ana görevleri göster (subtask'lar TaskCard içinde)
    const topLevelTasks = filteredTasks.filter((t) => !t.requiresParent);

    // Subtask'ları parent task altında tut
    const subtasksByParent = filteredTasks
        .filter((t) => t.requiresParent && t.parentTaskId)
        .reduce<Record<string, TaskListItem[]>>((acc, t) => {
            (acc[t.parentTaskId!] ??= []).push(t);
            return acc;
        }, {});

    const wipLimitByStatus = new Map(
        (columnSettings ?? []).map((s) => [s.status, s.wipLimit])
    );

    const isEpic = (task: TaskListItem) =>
        task.issueType.toLowerCase() === 'epic';

    const startEditingWip = (status: ItemStatus, current: number | null | undefined) => {
        setEditingWipFor(status);
        setWipDraft(current?.toString() ?? '');
    };

    const saveWipLimit = async (status: ItemStatus) => {
        const value = wipDraft.trim() ? Number(wipDraft) : null;
        await updateWipLimit.mutateAsync({ status, wipLimit: value });
        setEditingWipFor(null);
    };

    // Swimlane: Epic'e göre grupla
    const swimlaneGroups = swimlaneMode
        ? filteredTasks
            .filter((task) => {
                if (isEpic(task)) return true;
                if (task.parentTaskId) {
                    if (task.requiresParent) return false;
                    return true;
                }
                return !task.requiresParent;
            })
            .reduce<Record<string, TaskListItem[]>>((acc, task) => {
                const key = isEpic(task)
                    ? task.id
                    : task.parentTaskId ?? EPIC_GROUP_KEY;

                (acc[key] ??= []).push(task);
                return acc;
            }, {})
        : { [EPIC_GROUP_KEY]: topLevelTasks };

    const renderColumnCards = (colTasks: TaskListItem[], status: string) => {
        const isExpanded = expandedColumns.has(status);
        const visibleTasks = isExpanded ? colTasks : colTasks.slice(0, CARDS_PER_COLUMN_LIMIT);
        const hiddenCount = colTasks.length - visibleTasks.length;

        return (
            <div className="space-y-2">
                {visibleTasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        projectId={selectedProjectId}
                        subtasks={subtasksByParent[task.id]}
                        draggable
                        onDragStart={handleDragStart}
                    />
                ))}
                {colTasks.length === 0 && <p className="text-xs text-muted text-center py-4">Görev yok</p>}
                {hiddenCount > 0 && (
                    <button
                        onClick={() => toggleColumnExpanded(status)}
                        className="w-full text-xs text-indigo-600 dark:text-indigo-400 hover:underline py-1 cursor-pointer"
                    >
                        + {hiddenCount} görev daha göster
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-[1800px] mx-auto space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">
                        Board
                    </h1>
                    <p className="text-sm text-muted mt-0.5">
                        {activeSprint.name}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSwimlaneMode((v) => !v)}
                        className={`
                            inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition cursor-pointer
                            ${swimlaneMode
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300'
                                : 'border-border text-secondary hover:bg-surface-muted'
                            }
                        `}
                    >
                        {swimlaneMode ? '☰ Epic Görünümü Açık' : "☰ Epic'e Göre Grupla"}
                    </button>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 font-medium transition cursor-pointer"
                    >
                        + Görev Oluştur
                    </button>
                </div>
            </div>

            <TaskFilterBar filters={filters} members={members} />
            <AssigneeAvatarFilter members={members ?? []} selectedUserIds={selectedAssigneeIds} onToggle={toggleAssignee} />
            <SavedFiltersBar
                projectId={selectedProjectId}
                currentFilters={{
                    search: filters.search,
                    onlyMine: filters.onlyMine,
                    teamId: filters.teamId,
                    priority: filters.priority,
                    labelId: filters.labelId,
                }}
                onApply={(f) => {
                    filters.setSearch(f.search);
                    filters.setOnlyMine(f.onlyMine);
                    filters.setTeamId(f.teamId);
                    filters.setPriority(f.priority);
                    filters.setLabelId(f.labelId);
                }}
            />

            {statusError && <p className="text-red-500 text-sm font-medium">{statusError}</p>}

            {isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : (
                <div className="space-y-6">
                    {Object.entries(swimlaneGroups).map(([groupKey, groupTasks]) => {
                        const epicTask = groupKey !== EPIC_GROUP_KEY
                            ? filteredTasks.find((t) => t.id === groupKey)
                            : null;

                        return (
                            <div key={groupKey} className={swimlaneMode && groupKey !== EPIC_GROUP_KEY ? `border-l-4 ${colorForEpic(groupKey)} pl-3` : ''}>
                                {swimlaneMode && groupKey !== EPIC_GROUP_KEY && (
                                    <p className="text-xs font-semibold text-secondary mb-2">
                                        📦 {epicTask?.title ?? 'Epic'}
                                    </p>
                                )}
                                {swimlaneMode && groupKey === EPIC_GROUP_KEY && groupTasks.length > 0 && (
                                    <p className="text-xs font-semibold text-muted mb-2">Epic'siz Görevler</p>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto">
                                    {BOARD_COLUMNS.map((col) => {
                                        const colTasks = groupTasks.filter((t) => t.status === col.status);

                                        // WIP limiti kontrolü BOARD GENELİNDEKİ toplam kart sayısına göre yapılır
                                        const totalInColumnAcrossBoard = topLevelTasks.filter((t) => t.status === col.status).length;
                                        const wipLimit = wipLimitByStatus.get(col.status);
                                        const isOverLimit = wipLimit != null && totalInColumnAcrossBoard > wipLimit;

                                        return (
                                            <div
                                                key={col.status}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setDragOverColumn(col.status);
                                                }}
                                                onDragLeave={() => setDragOverColumn(null)}
                                                onDrop={(e) => handleDrop(e, col.status)}
                                                className={`
                                                    bg-slate-100/70 dark:bg-gray-900/70 rounded-lg p-2.5 min-h-[300px] border border-slate-200/70 dark:border-gray-800 transition-all
                                                    ${dragOverColumn === col.status
                                                        ? 'bg-indigo-50 dark:bg-indigo-950 ring-2 ring-indigo-300 dark:ring-indigo-700'
                                                        : ''
                                                    } ${isOverLimit
                                                        ? 'ring-2 ring-red-300 dark:ring-red-700 bg-red-50 dark:bg-red-950/40'
                                                        : ''
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between px-1.5 mb-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                                                        {col.label}
                                                    </span>

                                                    {editingWipFor === col.status ? (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={wipDraft}
                                                                onChange={(e) => setWipDraft(e.target.value)}
                                                                placeholder="∞"
                                                                autoFocus
                                                                onBlur={() => saveWipLimit(col.status)}
                                                                onKeyDown={(e) => e.key === 'Enter' && saveWipLimit(col.status)}
                                                                className="w-12 text-xs input-base border rounded px-1 py-0.5"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => isPM && startEditingWip(col.status, wipLimit)}
                                                            className={`text-xs ${isOverLimit ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted'} ${isPM ? 'hover:underline cursor-pointer' : ''}`}
                                                            title={
                                                                isPM
                                                                    ? 'WIP limitini düzenle (board genelinde geçerli)'
                                                                    : swimlaneMode
                                                                        ? `Bu gruptaki kart: ${colTasks.length} · Board geneli: ${totalInColumnAcrossBoard}/${wipLimit ?? '∞'}`
                                                                        : undefined
                                                            }
                                                        >
                                                            {swimlaneMode ? colTasks.length : totalInColumnAcrossBoard}
                                                            {wipLimit != null ? `/${wipLimit}` : ''}
                                                        </button>
                                                    )}
                                                </div>

                                                {isOverLimit && !swimlaneMode && (
                                                    <p className="text-[10px] text-red-500 dark:text-red-400 px-1 mb-1 font-medium">⚠ WIP limiti aşıldı</p>
                                                )}
                                                {isOverLimit && swimlaneMode && (
                                                    <p className="text-[10px] text-red-500 dark:text-red-400 px-1 mb-1 font-medium">
                                                        ⚠ Board genelinde limit aşıldı ({totalInColumnAcrossBoard}/{wipLimit})
                                                    </p>
                                                )}

                                                {renderColumnCards(colTasks, col.status)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <CreateTaskModal
                projectId={selectedProjectId}
                sprintId={activeSprint.id}
                isOpen={isCreateOpen}
                onClose={() => setCreateOpen(false)}
            />
        </div>
    );
}