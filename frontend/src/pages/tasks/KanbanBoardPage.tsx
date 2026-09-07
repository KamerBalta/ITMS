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
import { colorForEpic } from '../../lib/groupByEpic';
import type { TaskListItem } from '../../types/task';

const NO_PARENT_GROUP_KEY = '__no_parent__';

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

    // #Perf: swimlane'de gosterilecek Epic'lerin cogu zaten sprint gorevleri icinde
    // bulunuyor (kendisi de sprint'teyse). Yalnizca sprint DISINDA kalan bir Epic'in
    // basligini bulmamiz gerektiginde (nadir durum) tam proje listesini cekiyoruz.
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

    if (!selectedProjectId) return <p className="text-muted">Devam etmek için üstten bir proje seçin.</p>;

    if (!isKanban && !activeSprint) {
        return (
            <div className="text-center py-16">
                <p className="text-muted">Bu Scrum board için aktif bir sprint yok.</p>
                <p className="text-sm text-muted mt-1">Board'u kullanabilmek için önce Backlog sayfasından bir sprint başlatın.</p>
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
                    ? 'Bu görev başka biri tarafından değiştirildi. Board güncellendi.'
                    : 'Bu durum geçişine yetkiniz yok veya geçiş kuralına aykırı.'
            );
            // #10: Rollback artik useUpdateTaskStatus'un onError'unda otomatik yapiliyor
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
                <TaskCard key={task.id} task={task} projectId={selectedProjectId} subtasks={subtasksByParent[task.id]} draggable onDragStart={handleDragStart} />
            ))}
            {colTasks.length === 0 && <p className="text-xs text-muted text-center py-4">Görev yok</p>}
        </div>
    );

    const renderSwimlaneRow = (groupKey: string, groupTasks: TaskListItem[]) => {
        const isCollapsed = collapsedSwimlanes.has(groupKey);
        const epicTask = groupKey !== NO_PARENT_GROUP_KEY
            ? groupTasks.find((t) => t.id === groupKey) ?? epicCandidates?.find((e) => e.id === groupKey)
            : null;

        // #14: Epic swimlane basligindaki ilerleme -- yalnizca BU SPRINT'teki cocuklara bakar
        // (Roadmap sayfasindaki gibi TUM proje capinda degil), cunku Board zaten sprint bazli calisir.
        const doneCount = groupTasks.filter((t) => {
            const column = sortedColumns.find((c) => c.statuses.some((s) => s.id === t.statusId));
            return column?.statuses.some((s) => s.id === t.statusId && s.category === 'Done');
        }).length;
        const progressPct = groupTasks.length > 0 ? Math.round((doneCount / groupTasks.length) * 100) : 0;

        return (
            <div key={groupKey} className={swimlaneMode && groupKey !== NO_PARENT_GROUP_KEY ? `border-l-4 ${colorForEpic(groupKey)} pl-3` : ''}>
                {swimlaneMode && groupKey !== NO_PARENT_GROUP_KEY && (
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => toggleSwimlaneCollapsed(groupKey)} className="flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary">
                            <span>{isCollapsed ? '▸' : '▾'}</span>
                            <span>{epicTask?.issueTypeIcon ?? '📦'}</span>
                            {epicTask?.title ?? 'Üst Görev'}
                            <span className="text-muted font-normal">({groupTasks.length})</span>
                        </button>
                        {groupTasks.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: `${progressPct}%` }} />
                                </div>
                                <span className="text-[10px] text-muted">{progressPct}%</span>
                            </div>
                        )}
                    </div>
                )}
                {swimlaneMode && groupKey === NO_PARENT_GROUP_KEY && groupTasks.length > 0 && (
                    <button onClick={() => toggleSwimlaneCollapsed(groupKey)} className="flex items-center gap-1 text-xs font-semibold text-muted mb-2 hover:text-secondary">
                        <span>{isCollapsed ? '▸' : '▾'}</span>
                        Üst Görevi Olmayanlar <span className="font-normal">({groupTasks.length})</span>
                    </button>
                )}

                {!isCollapsed && (
                    <div className="overflow-x-auto pb-2 -mx-1 px-1">
                        <div
                            className="grid gap-3 md:grid-cols-none"
                            style={{
                                gridTemplateColumns: `repeat(${sortedColumns.length || 1}, minmax(240px, 1fr))`,
                                minWidth: sortedColumns.length > 4 ? `${sortedColumns.length * 240}px` : undefined,
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
                                        className={`rounded-lg p-2 min-h-[200px] transition-colors ${col.id === '00000000-0000-0000-0000-000000000000'
                                            ? 'bg-orange-50 dark:bg-orange-950/30 border-2 border-dashed border-orange-300 dark:border-orange-800'
                                            : 'bg-gray-100 dark:bg-gray-900'
                                            } ${dragOverColumn === col.id ? 'bg-indigo-50 dark:bg-indigo-950 ring-2 ring-indigo-300 dark:ring-indigo-700' : ''} ${isOverLimit ? 'ring-2 ring-red-300 dark:ring-red-700 bg-red-50 dark:bg-red-950' : ''}`}
                                    >
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <span className="text-xs font-semibold text-secondary">{col.name}</span>
                                            {editingWipFor === col.id ? (
                                                <input
                                                    type="number" min={0} value={wipDraft} onChange={(e) => setWipDraft(e.target.value)} placeholder="∞" autoFocus
                                                    onBlur={() => saveWipLimit(col.id)} onKeyDown={(e) => e.key === 'Enter' && saveWipLimit(col.id)}
                                                    className="w-12 text-xs input-base border rounded px-1 py-0.5"
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => isPM && startEditingWip(col.id, wipLimit)}
                                                    className={`text-xs ${isOverLimit ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted'} ${isPM ? 'hover:underline cursor-pointer' : ''}`}
                                                >
                                                    {swimlaneMode ? colTasks.length : totalAcrossBoard}{wipLimit != null ? `/${wipLimit}` : ''}
                                                </button>
                                            )}
                                        </div>
                                        {isOverLimit && <p className="text-[10px] text-red-500 dark:text-red-400 px-1 mb-1">⚠ Board genelinde limit aşıldı ({totalAcrossBoard}/{wipLimit})</p>}
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">{currentBoard?.name ?? 'Board'}</h1>
                    <p className="text-sm text-muted">{isKanban ? 'Kanban — sürekli iş akışı' : activeSprint?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedProjectId && (
                        <BoardSelector
                            projectId={selectedProjectId}
                            selectedBoardId={selectedBoardId}
                            onSelect={setSelectedBoardId}
                        />
                    )}

                    <button
                        onClick={() => setSwimlaneMode((v) => !v)}
                        className={`text-sm px-3 py-2 rounded border ${swimlaneMode ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-600 text-secondary'}`}
                    >
                        {swimlaneMode ? '☰ Gruplanmış Görünüm Açık' : 'Gruplanmış Görünüm (Swimlane)'}
                    </button>

                    {canManageColumns && (
                        <button
                            onClick={() => setIsEditingColumns((v) => !v)}
                            className={`text-sm px-3 py-2 rounded border ${isEditingColumns
                                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                                : 'border-gray-200 dark:border-gray-600 text-secondary'
                                }`}
                        >
                            ✎ Kolonları Düzenle
                        </button>
                    )}

                    <button onClick={() => setCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                        + Görev Oluştur
                    </button>
                </div>
            </div>

            <TaskFilterBar filters={filters} members={members} />
            <AssigneeAvatarFilter members={members ?? []} selectedUserIds={selectedAssigneeIds} onToggle={toggleAssignee} />
            <SavedFiltersBar
                projectId={selectedProjectId}
                currentFilters={{ search: filters.search, onlyMine: filters.onlyMine, teamId: filters.teamId, priority: filters.priority, labelId: filters.labelId }}
                onApply={(f) => { filters.setSearch(f.search); filters.setOnlyMine(f.onlyMine); filters.setTeamId(f.teamId); filters.setPriority(f.priority); filters.setLabelId(f.labelId); }}
            />

            {isEditingColumns && selectedBoardId && (
                <BoardColumnEditBar boardId={selectedBoardId} onClose={() => setIsEditingColumns(false)} />
            )}

            {statusError && <p className="text-red-500 text-sm">{statusError}</p>}

            {isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : (
                <div className="space-y-6">
                    {epicGroupEntries.map(([key, groupTasks]) => renderSwimlaneRow(key, groupTasks))}
                    {noParentTasks.length > 0 && renderSwimlaneRow(NO_PARENT_GROUP_KEY, noParentTasks)}
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