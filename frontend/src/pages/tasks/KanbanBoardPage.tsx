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

    const toggleAssignee = (userId: string) => {
        setSelectedAssigneeIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    if (!selectedProjectId) {
        return <p className="text-gray-500">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (!activeSprint) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500">Bu projede aktif bir sprint yok.</p>
                <p className="text-sm text-gray-400 mt-1">
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

    // Normal board görünümünde ana görevleri göster.
    // Subtask'lar TaskCard içinde gösterilecek.
    const topLevelTasks = filteredTasks.filter((t) => !t.requiresParent);

    // Subtask'ları parent task altında tut.
    const subtasksByParent = filteredTasks
        .filter((t) => t.requiresParent && t.parentTaskId)
        .reduce<Record<string, TaskListItem[]>>((acc, t) => {
            (acc[t.parentTaskId!] ??= []).push(t);
            return acc;
        }, {});

    const wipLimitByStatus = new Map(
        (columnSettings ?? []).map((s) => [s.status, s.wipLimit])
    );

    // Issue type üzerinden Epic'i belirle.
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
                // Epic'in kendisi
                if (isEpic(task)) return true;

                // Parent'ı olan görevler
                if (task.parentTaskId) {
                    // Subtask'ları swimlane'e ayrıca koyma.
                    // Bunlar TaskCard içinde gösterilecek.
                    if (task.requiresParent) return false;

                    // Epic'e bağlı Story / Task
                    return true;
                }

                // Epic'e bağlı olmayan normal görev
                return !task.requiresParent;
            })
            .reduce<Record<string, TaskListItem[]>>((acc, task) => {
                // Epic kendisi kendi grubunun anahtarıdır.
                const key = isEpic(task)
                    ? task.id
                    : task.parentTaskId ?? EPIC_GROUP_KEY;

                (acc[key] ??= []).push(task);

                return acc;
            }, {})
        : { [EPIC_GROUP_KEY]: topLevelTasks };

    const renderColumnCards = (colTasks: TaskListItem[]) => (
        <div className="space-y-2">
            {colTasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    projectId={selectedProjectId}
                    subtasks={subtasksByParent[task.id]}
                    draggable
                    onDragStart={handleDragStart}
                />
            ))}
            {colTasks.length === 0 && <p className="text-xs text-gray-300 text-center py-4">Görev yok</p>}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Kanban Board</h1>
                    <p className="text-sm text-muted">{activeSprint.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSwimlaneMode((v) => !v)}
                        className={`text-sm px-3 py-2 rounded border ${swimlaneMode
                                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                                : 'border-gray-200 dark:border-gray-600 text-secondary'
                            }`}
                    >
                        {swimlaneMode ? '☰ Epic Görünümü Açık' : "☰ Epic'e Göre Grupla"}
                    </button>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
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

            {statusError && <p className="text-red-500 text-sm">{statusError}</p>}

            {isLoading ? (
                <p className="text-gray-500">Yükleniyor...</p>
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
                                    <p className="text-xs font-semibold text-gray-400 mb-2">Epic'siz Görevler</p>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto">
                                    {BOARD_COLUMNS.map((col) => {
                                        const colTasks = groupTasks.filter((t) => t.status === col.status);
                                        const wipLimit = wipLimitByStatus.get(col.status);
                                        const isOverLimit = wipLimit != null && colTasks.length > wipLimit;

                                        return (
                                            <div
                                                key={col.status}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setDragOverColumn(col.status);
                                                }}
                                                onDragLeave={() => setDragOverColumn(null)}
                                                onDrop={(e) => handleDrop(e, col.status)}
                                                className={`bg-gray-100 dark:bg-gray-900 rounded-lg p-2 min-h-[200px] transition-colors ${dragOverColumn === col.status
                                                        ? 'bg-indigo-50 dark:bg-indigo-950 ring-2 ring-indigo-300 dark:ring-indigo-700'
                                                        : ''
                                                    } ${isOverLimit
                                                        ? 'ring-2 ring-red-300 dark:ring-red-700 bg-red-50 dark:bg-red-950'
                                                        : ''
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between px-1 mb-2">
                                                    <span className="text-xs font-semibold text-secondary">{col.label}</span>

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
                                                                className="w-12 text-xs border rounded px-1 py-0.5"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => isPM && startEditingWip(col.status, wipLimit)}
                                                            className={`text-xs ${isOverLimit ? 'text-red-600 font-bold' : 'text-gray-400'} ${isPM ? 'hover:underline cursor-pointer' : ''
                                                                }`}
                                                            title={isPM ? 'WIP limitini düzenle' : undefined}
                                                        >
                                                            {colTasks.length}
                                                            {wipLimit != null ? `/${wipLimit}` : ''}
                                                        </button>
                                                    )}
                                                </div>

                                                {isOverLimit && (
                                                    <p className="text-[10px] text-red-500 px-1 mb-1">⚠ WIP limiti aşıldı</p>
                                                )}

                                                {renderColumnCards(colTasks)}
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