import { useState } from 'react';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import {
    useTasks,
    useUpdateTaskStatus,
    useProjectTasksForParentSelection,
    filterEpicCandidates,
} from '../../hooks/useTasks';
import { useActiveSprint } from '../../hooks/useSprints';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { useAllLabels } from '../../hooks/useTaskDetail';
import { useBoardColumns, useBoardColumnSettings, useUpdateWipLimit } from '../../hooks/useBoardColumns';
import { useBoards } from '../../hooks/useBoards';
import { useCanManageProject } from '../../hooks/useCanManageProject';
import { BoardSelector } from '../../components/BoardSelector';
import { TaskCard } from '../../components/TaskCard';
import { TaskFilterBar } from '../../components/TaskFilterBar';
import { AssigneeAvatarFilter } from '../../components/AssigneeAvatarFilter';
import { SavedFiltersBar } from '../../components/SavedFiltersBar';
import { BoardColumnEditBar } from '../../components/BoardColumnEditBar';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { PRIORITY_LABELS, type TaskListItem } from '../../types/task';

const NO_PARENT_GROUP_KEY = '__no_parent__';

function getLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getTaskDueDateKey(dueDate?: string | null): string | null {
    if (!dueDate) return null;

    // DateOnly değerleri "2026-09-08" veya ISO formatında gelebilir.
    return dueDate.slice(0, 10);
}

export function KanbanBoardPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const currentUser = useAuthStore((state) => state.user);
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const canManageColumns = useCanManageProject(selectedProjectId);

    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const { data: boards } = useBoards(selectedProjectId);
    const currentBoard = boards?.find((b) => b.id === selectedBoardId);
    const isKanban = currentBoard?.boardType === 'Kanban';

    const { activeSprint } = useActiveSprint(selectedProjectId);
    const { data: tasks, isLoading } = useTasks(
        selectedProjectId,
        isKanban ? { boardId: selectedBoardId! } : { sprintId: activeSprint?.id, backlogOnly: false }
    );
    const { data: members } = useProjectMembers(selectedProjectId);
    const { data: labels } = useAllLabels();
    const { data: columns } = useBoardColumns(selectedBoardId);
    const { data: columnSettings } = useBoardColumnSettings(selectedBoardId);

    const updateWipLimit = useUpdateWipLimit(selectedBoardId ?? '');
    const updateStatus = useUpdateTaskStatus(selectedProjectId ?? '');
    const filters = useTaskFilters();

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditingColumns, setIsEditingColumns] = useState(false);
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<Set<string>>(new Set());
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [swimlaneMode, setSwimlaneMode] = useState(false);
    const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(new Set());
    const [editingWipFor, setEditingWipFor] = useState<string | null>(null);
    const [wipDraft, setWipDraft] = useState('');

    const epicGroupKeys = swimlaneMode
        ? new Set((tasks ?? []).map((t) => t.parentTaskId).filter((id): id is string => !!id))
        : new Set<string>();
    const missingEpicTitles = [...epicGroupKeys].some((key) => !(tasks ?? []).some((t) => t.id === key));
    const { data: allProjectTasks } = useProjectTasksForParentSelection(
        selectedProjectId,
        swimlaneMode && missingEpicTitles
    );
    const epicCandidates = filterEpicCandidates(allProjectTasks);

    const toggleAssignee = (userId: string) => {
        setSelectedAssigneeIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const toggleSwimlaneCollapsed = (key: string) => {
        setCollapsedSwimlanes((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    if (!selectedProjectId) {
        return <p className="text-muted p-4 sm:p-6">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (!isKanban && !activeSprint) {
        return (
            <div className="text-center py-16 px-4">
                <p className="text-muted font-medium">Bu Scrum panosu için aktif bir sprint yok.</p>
                <p className="text-sm text-muted mt-1">Panoyu kullanabilmek için önce Backlog sayfasından bir sprint başlatın.</p>
            </div>
        );
    }

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
        e.preventDefault();
        setDragOverColumn(null);
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        setStatusError(null);
        try {
            await updateStatus.mutateAsync({ taskId, statusId: targetStatusId });
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setStatusError(
                axiosError.response?.status === 409
                    ? 'Bu görev başka biri tarafından değiştirildi. Pano güncellendi.'
                    : 'Bu durum geçişine yetkiniz yok veya geçiş kuralına aykırı.'
            );
            setTimeout(() => setStatusError(null), 4000);
        }
    };

    const filteredTasks = (tasks ?? []).filter((t) => {
        if (
            filters.search &&
            !t.title.toLowerCase().includes(filters.search.toLowerCase())
        ) {
            return false;
        }

        if (filters.priority) {
            const selectedPriority =
                PRIORITY_LABELS[
                Number(filters.priority) as keyof typeof PRIORITY_LABELS
                ];

            if (t.priority !== selectedPriority) return false;
        }

        if (filters.onlyMine && t.assigneeId !== currentUser?.userId) {
            return false;
        }

        if (filters.teamId) {
            const member = members?.find((m) => m.userId === t.assigneeId);

            if (member?.teamId !== filters.teamId) {
                return false;
            }
        }

        if (filters.labelId) {
            const labelName = labels?.find(
                (l) => l.id === filters.labelId
            )?.name;

            if (!labelName || !t.labels.includes(labelName)) {
                return false;
            }
        }

        if (selectedAssigneeIds.size > 0) {
            if (
                !t.assigneeId ||
                !selectedAssigneeIds.has(t.assigneeId)
            ) {
                return false;
            }
        }

        // Due Date filtresi
        if (filters.dueDate) {
            const dueDateKey = getTaskDueDateKey(t.dueDate);

            if (filters.dueDate === 'noDueDate') {
                if (dueDateKey !== null) return false;
            } else {
                // Due Date filtresi seçilmişse DueDate'i olmayan görevler eşleşmez.
                if (!dueDateKey) return false;

                const today = new Date();
                const todayKey = getLocalDateKey(today);

                if (filters.dueDate === 'overdue') {
                    // Bugün henüz bitmediği için sadece dünden öncesi.
                    if (dueDateKey >= todayKey) return false;
                }

                if (filters.dueDate === 'today') {
                    if (dueDateKey !== todayKey) return false;
                }

                if (filters.dueDate === 'tomorrow') {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const tomorrowKey = getLocalDateKey(tomorrow);

                    if (dueDateKey !== tomorrowKey) return false;
                }

                if (filters.dueDate === 'next7days') {
                    const next7Days = new Date(today);
                    next7Days.setDate(next7Days.getDate() + 7);

                    const next7DaysKey = getLocalDateKey(next7Days);

                    if (
                        dueDateKey < todayKey ||
                        dueDateKey > next7DaysKey
                    ) {
                        return false;
                    }
                }
            }
        }

        return true;
    });

    const topLevelTasks = filteredTasks.filter((t) => !t.requiresParent);
    const subtasksByParent = filteredTasks
        .filter((t) => t.requiresParent && t.parentTaskId)
        .reduce<Record<string, TaskListItem[]>>((acc, t) => {
            (acc[t.parentTaskId!] ??= []).push(t);
            return acc;
        }, {});

    const swimlaneGroups: Record<string, TaskListItem[]> = {};
    if (swimlaneMode) {
        topLevelTasks.forEach((t) => {
            if (t.parentTaskId) {
                (swimlaneGroups[t.parentTaskId] ??= []).push(t);
            } else if (t.allowsChildren) {
                (swimlaneGroups[t.id] ??= []).push(t);
            } else {
                (swimlaneGroups[NO_PARENT_GROUP_KEY] ??= []).push(t);
            }
        });
    } else {
        swimlaneGroups[NO_PARENT_GROUP_KEY] = topLevelTasks;
    }

    const epicGroupEntries = Object.entries(swimlaneGroups).filter(([k]) => k !== NO_PARENT_GROUP_KEY);
    const noParentTasks = swimlaneGroups[NO_PARENT_GROUP_KEY] ?? [];

    const wipLimitByColumn = new Map<string, number | null | undefined>(
        (columnSettings ?? []).map((s) => [s.boardColumnId, s.wipLimit])
    );
    const sortedColumns = [...(columns ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

    const startEditingWip = (columnId: string, current: number | null | undefined) => {
        setEditingWipFor(columnId);
        setWipDraft(current?.toString() ?? '');
    };

    const saveWipLimit = async (columnId: string) => {
        const value = wipDraft.trim() ? Number(wipDraft) : null;
        await updateWipLimit.mutateAsync({ columnId, wipLimit: value });
        setEditingWipFor(null);
    };

    const renderColumnCards = (colTasks: TaskListItem[]) => (
        <div className="space-y-2">
            {colTasks.map((task) => (
                <div key={task.id} className="group">
                    <TaskCard
                        task={task}
                        projectId={selectedProjectId}
                        subtasks={subtasksByParent[task.id]}
                        draggable
                        onDragStart={handleDragStart}
                    />
                </div>
            ))}

            {colTasks.length === 0 && (
                <div className="flex min-h-[100px] items-center justify-center rounded border border-dashed border-gray-300 text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500 sm:min-h-[120px]">
                    Görev yok
                </div>
            )}
        </div>
    );

    const renderSwimlaneRow = (groupKey: string, groupTasks: TaskListItem[]) => {
        const isCollapsed = collapsedSwimlanes.has(groupKey);
        const epicTask = groupKey !== NO_PARENT_GROUP_KEY
            ? groupTasks.find((t) => t.id === groupKey) ?? epicCandidates?.find((e) => e.id === groupKey)
            : null;

        const doneCount = groupTasks.filter((t) => {
            const column = sortedColumns.find((c) => c.statuses.some((s) => s.id === t.statusId));
            return column?.statuses.some((s) => s.id === t.statusId && s.category === 'Done');
        }).length;
        const progressPct = groupTasks.length > 0 ? Math.round((doneCount / groupTasks.length) * 100) : 0;

        return (
            <div
                key={groupKey}
                className={
                    swimlaneMode && groupKey !== NO_PARENT_GROUP_KEY
                        ? `border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900`
                        : ''
                }
            >
                {swimlaneMode && groupKey !== NO_PARENT_GROUP_KEY && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/60">
                        <button
                            onClick={() => toggleSwimlaneCollapsed(groupKey)}
                            className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-800 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400 cursor-pointer"
                        >
                            <span className="w-4 text-center text-gray-500">
                                {isCollapsed ? '▸' : '▾'}
                            </span>

                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-200 text-xs dark:bg-gray-700">
                                {epicTask?.issueTypeIcon ?? 'E'}
                            </span>

                            <span className="truncate max-w-[200px] sm:max-w-md">
                                {epicTask?.title ?? 'Üst Görev'}
                            </span>

                            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {groupTasks.length}
                            </span>
                        </button>

                        <div className="flex items-center gap-3 ml-auto">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 sm:w-20">
                                    <div
                                        className="h-full bg-blue-600 dark:bg-blue-500"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>

                                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                    %{progressPct}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {swimlaneMode &&
                    groupKey === NO_PARENT_GROUP_KEY &&
                    groupTasks.length > 0 && (
                        <div className="flex items-center border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/60">
                            <button
                                onClick={() => toggleSwimlaneCollapsed(groupKey)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 cursor-pointer"
                            >
                                <span className="w-4 text-center">
                                    {isCollapsed ? '▸' : '▾'}
                                </span>

                                <span>Diğer Görevler</span>

                                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    {groupTasks.length}
                                </span>
                            </button>
                        </div>
                    )}

                {!isCollapsed && (
                    <div className="overflow-x-auto px-2 sm:px-3 pb-3 pt-3">
                        <div
                            className="grid items-start gap-3 grid-flow-col auto-cols-[250px] sm:auto-cols-[260px] md:auto-cols-auto md:grid-flow-row"
                            style={{
                                gridTemplateColumns: `repeat(${sortedColumns.length || 1}, minmax(250px, 1fr))`,
                                minWidth: sortedColumns.length > 1 ? `${sortedColumns.length * 250}px` : undefined,
                            }}
                        >
                            {sortedColumns.map((col) => {
                                const statusIdsInColumn = col.statuses.map((s) => s.id);
                                const colTasks = groupTasks.filter((t) => statusIdsInColumn.includes(t.statusId));
                                const totalAcrossBoard = topLevelTasks.filter((t) => statusIdsInColumn.includes(t.statusId)).length;
                                const wipLimit = wipLimitByColumn.get(col.id);
                                const isOverLimit = wipLimit != null && totalAcrossBoard > wipLimit;

                                return (
                                    <div
                                        key={col.id}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.id); }}
                                        onDragLeave={() => setDragOverColumn(null)}
                                        onDrop={(e) => handleDrop(e, statusIdsInColumn[0])}
                                        className={`min-h-[220px] rounded-md bg-[#f1f2f4] p-2 transition-colors dark:bg-gray-800/60 sm:min-h-[240px] ${col.id === '00000000-0000-0000-0000-000000000000'
                                            ? 'border-2 border-dashed border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20'
                                            : ''
                                            } ${dragOverColumn === col.id
                                                ? 'bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950/40 dark:ring-blue-600'
                                                : ''
                                            } ${isOverLimit
                                                ? 'bg-red-50 ring-1 ring-red-300 dark:bg-red-950/30 dark:ring-red-700'
                                                : ''
                                            }`}
                                    >
                                        <div className="mb-2 flex items-center justify-between border-b border-gray-200/80 px-1 pb-2 dark:border-gray-700">
                                            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                                                <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                                    {col.name}
                                                </span>

                                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${isOverLimit
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {swimlaneMode ? colTasks.length : totalAcrossBoard}
                                                </span>
                                            </div>

                                            {editingWipFor === col.id ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={wipDraft}
                                                    onChange={(e) => setWipDraft(e.target.value)}
                                                    placeholder="∞"
                                                    autoFocus
                                                    onBlur={() => saveWipLimit(col.id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveWipLimit(col.id)}
                                                    className="w-12 sm:w-14 rounded border border-gray-300 bg-white px-1 py-0.5 sm:px-1.5 sm:py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => isPM && startEditingWip(col.id, wipLimit)}
                                                    className={`rounded px-1.5 py-0.5 text-[10px] ${isOverLimit
                                                        ? 'font-bold text-red-600 dark:text-red-400 bg-red-100/50'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                        } ${isPM
                                                            ? 'cursor-pointer hover:text-blue-600 hover:underline'
                                                            : ''
                                                        }`}
                                                >
                                                    {wipLimit != null ? `WIP ${wipLimit}` : 'WIP'}
                                                </button>
                                            )}
                                        </div>

                                        {isOverLimit && (
                                            <div className="mb-2 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                                WIP limiti aşıldı · {totalAcrossBoard}/{wipLimit}
                                            </div>
                                        )}

                                        {renderColumnCards(colTasks)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fa] dark:bg-gray-950">
            {/* Üst Toolbar */}
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <div className="flex min-h-[64px] flex-col justify-center gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="min-w-0">
                            <h1 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                                {currentBoard?.name ?? 'Pano'}
                            </h1>

                            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                {isKanban ? 'Kanban panosu' : activeSprint?.name}
                            </p>
                        </div>

                        {selectedProjectId && (
                            <div className="shrink-0">
                                <BoardSelector
                                    projectId={selectedProjectId}
                                    selectedBoardId={selectedBoardId}
                                    onSelect={setSelectedBoardId}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            onClick={() => setSwimlaneMode((v) => !v)}
                            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors shrink-0 cursor-pointer ${swimlaneMode
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="text-xs text-gray-500 dark:text-gray-400">☷</span>
                            {swimlaneMode ? 'Kulvarlar' : 'Grupla'}
                        </button>

                        {canManageColumns && (
                            <button
                                onClick={() => setIsEditingColumns((v) => !v)}
                                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors shrink-0 cursor-pointer ${isEditingColumns
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="text-xs text-gray-500 dark:text-gray-400">⚙</span>
                                Pano ayarları
                            </button>
                        )}

                        <button
                            onClick={() => setCreateOpen(true)}
                            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 sm:ml-0 cursor-pointer"
                        >
                            <span className="text-sm leading-none">+</span>
                            Oluştur
                        </button>
                    </div>
                </div>
            </div>

            {/* İki Katlı Filtre Toolbar */}
            <div className="flex flex-col gap-2 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900 shrink-0 sm:px-5">
                {/* 1. Satır: Arama ve Normal Filtreler */}
                <div className="min-w-0 overflow-x-auto">
                    <TaskFilterBar
                        filters={filters}
                        members={members}
                    />
                </div>

                {/* 2. Satır: Kişi Avatarları ve Kayıtlı Filtreler */}
                <div className="flex min-w-0 items-center gap-3 overflow-x-auto border-t border-gray-100 pt-2 dark:border-gray-800">
                    <div className="shrink-0">
                        <AssigneeAvatarFilter
                            members={members ?? []}
                            selectedUserIds={selectedAssigneeIds}
                            onToggle={toggleAssignee}
                        />
                    </div>

                    <div className="h-5 w-px shrink-0 bg-gray-200 dark:bg-gray-700" />

                    <div className="shrink-0">
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
                    </div>
                </div>
            </div>

            {isEditingColumns && selectedBoardId && (
                <div className="px-4 pt-3 sm:px-5 shrink-0">
                    <BoardColumnEditBar boardId={selectedBoardId} onClose={() => setIsEditingColumns(false)} />
                </div>
            )}

            {statusError && (
                <div className="mx-4 mt-3 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 sm:mx-5 shrink-0">
                    <span>{statusError}</span>

                    <button
                        onClick={() => setStatusError(null)}
                        className="ml-3 sm:ml-4 shrink-0 rounded px-2 py-1 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer"
                    >
                        Kapat
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="flex min-h-[300px] sm:min-h-[400px] items-center justify-center flex-1">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Pano yükleniyor...
                    </div>
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-4">
                    <div className="space-y-3">
                        {epicGroupEntries.map(([key, groupTasks]) =>
                            renderSwimlaneRow(key, groupTasks)
                        )}

                        {noParentTasks.length > 0 &&
                            renderSwimlaneRow(NO_PARENT_GROUP_KEY, noParentTasks)}
                    </div>
                </div>
            )}

            <CreateTaskModal
                projectId={selectedProjectId}
                sprintId={isKanban ? null : activeSprint?.id ?? null}
                isOpen={isCreateOpen}
                onClose={() => setCreateOpen(false)}
            />
        </div>
    );
}