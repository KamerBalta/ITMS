import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useTasks, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useActiveSprint } from '../../hooks/useSprints';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { TaskCard } from '../../components/TaskCard';
import { TaskFilterBar } from '../../components/TaskFilterBar';
import { AssigneeAvatarFilter } from '../../components/AssigneeAvatarFilter';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { BOARD_COLUMNS, STATUS_TO_INT } from '../../lib/taskStatus';
import type { ItemStatus } from '../../types/task';
import { Plus, Kanban, AlertCircle, Star, MoreHorizontal, Check } from 'lucide-react';

export function KanbanBoardPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const currentUser = useAuthStore((state) => state.user);
    const { activeSprint } = useActiveSprint(selectedProjectId);
    const { data: tasks, isLoading } = useTasks(selectedProjectId, { sprintId: activeSprint?.id, backlogOnly: false });
    const { data: members } = useProjectMembers(selectedProjectId);
    const updateStatus = useUpdateTaskStatus(selectedProjectId ?? '');
    const filters = useTaskFilters();

    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<Set<string>>(new Set());

    const toggleAssignee = (userId: string) => {
        setSelectedAssigneeIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [dragOverColumn, setDragOverColumn] = useState<ItemStatus | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);

    if (!selectedProjectId) {
        return <p className="text-slate-500 text-xs p-4">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (!activeSprint) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto my-8 shadow-xs space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Kanban className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Aktif Sprint Bulunamadı</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Kanban panosunu kullanabilmek için önce Backlog sayfasından bir sprint başlatmanız gerekmektedir.
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
            setStatusError('Bu durum geçişine yetkiniz yok veya durum kuralına aykırı.');
            setTimeout(() => setStatusError(null), 4000);
        }
    };

    // Client-side filtreleme mantığı
    const teamByUserName = new Map((members ?? []).map((m) => [m.userName, m.teamId]));

    const filteredTasks = (tasks ?? []).filter((t) => {
        if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.priority && t.priority !== filters.priority) return false;
        if (filters.onlyMine) {
            const assigneeMember = members?.find((m) => m.userName === t.assigneeName);
            if (assigneeMember?.userId !== currentUser?.userId) return false;
        }
        if (filters.teamId) {
            const taskTeamId = t.assigneeName ? teamByUserName.get(t.assigneeName) : undefined;
            if (taskTeamId !== filters.teamId) return false;
        }
        // #Yeni: avatar bazli coklu assignee filtresi -- assigneeName uzerinden userId'ye esleniyor
        if (selectedAssigneeIds.size > 0) {
            const assigneeMember = members?.find((m) => m.userName === t.assigneeName);
            if (!assigneeMember || !selectedAssigneeIds.has(assigneeMember.userId)) return false;
        }
        return true;
    });

    // Sub-task'ları ana görev altında gruplama ve panoda tekil kart olarak çizilmelerini engelleme (requiresParent kontrolü ile)
    const topLevelTasks = filteredTasks.filter((t) => !t.requiresParent);
    const subtasksByParent = filteredTasks
        .filter((t) => t.requiresParent && t.parentTaskId)
        .reduce<Record<string, typeof filteredTasks>>((acc, t) => {
            (acc[t.parentTaskId!] ??= []).push(t);
            return acc;
        }, {});

    return (
        <div className="space-y-4 select-none max-w-[1600px] mx-auto px-2 sm:px-4 py-2">
            {/* 1. JIRA BREADCRUMB & BAŞLIK BAR */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <span>Projects</span>
                        <span>/</span>
                        <span className="text-slate-600 font-semibold">{activeSprint.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Board</h1>
                    </div>
                </div>

                {/* Sağ Taraf: Aksiyon Butonları */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Görev Oluştur</span>
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer">
                        <Star className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 2. JIRA FİLTRELEME BAR-I */}
            <div className="bg-white rounded-lg space-y-2">
                <TaskFilterBar filters={filters} members={members} />
                <AssigneeAvatarFilter
                    members={members ?? []}
                    selectedUserIds={selectedAssigneeIds}
                    onToggleUser={toggleAssignee}
                />
            </div>

            {/* Hata Mesajı */}
            {statusError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{statusError}</span>
                </div>
            )}

            {/* 3. JIRA SÜTUNLARI VE BOARD GRID'I */}
            {isLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">Pano yükleniyor...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto items-start min-h-[600px] pt-1">
                    {BOARD_COLUMNS.map((col) => {
                        const columnTasks = topLevelTasks.filter((t) => t.status === col.status);
                        const isDoneColumn = col.status === 'Done' || col.status === 'Closed';

                        return (
                            <div
                                key={col.status}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverColumn(col.status);
                                }}
                                onDragLeave={() => setDragOverColumn(null)}
                                onDrop={(e) => handleDrop(e, col.status)}
                                className={`bg-slate-100/70 border border-slate-200/60 rounded-lg p-2 min-h-[550px] flex flex-col transition-all duration-150 ${dragOverColumn === col.status
                                        ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20'
                                        : ''
                                    }`}
                            >
                                {/* Sütun Başlığı ve Görev Sayısı (Jira Stili) */}
                                <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            {col.label}
                                        </span>
                                        {isDoneColumn && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                                    </div>
                                    <span className="text-[11px] font-extrabold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                                        {columnTasks.length}
                                    </span>
                                </div>

                                {/* Görev Kartları Listesi */}
                                <div className="space-y-2 flex-1 pt-1">
                                    {columnTasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            projectId={selectedProjectId}
                                            subtasks={subtasksByParent[task.id]}
                                            draggable
                                            onDragStart={handleDragStart}
                                        />
                                    ))}
                                    {columnTasks.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-slate-200/80 rounded-lg flex items-center justify-center text-[11px] text-slate-400 font-medium">
                                            Görev yok
                                        </div>
                                    )}
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