import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useBacklog, useMoveToSprint } from '../../hooks/useBacklog';
import { useActiveSprint, useCompleteSprint } from '../../hooks/useSprints';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { CreateSprintModal } from '../../components/CreateSprintModal';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { BacklogTaskItem } from '../../api/backlog';
import { Avatar } from '../../components/Avatar';
import { usePagination } from '../../hooks/usePagination';
import { PaginationBar } from '../../components/PaginationBar';
import {
    Plus,
    Play,
    CheckCircle2,
    ArrowRight,
    Layers,
    Calendar,
    Archive,
    Package,
    Inbox,
    ChevronDown,
    ChevronRight,
    Bug,
    CheckSquare,
    Bookmark,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react';

// 1. İş Tipi İkonları
const ISSUE_ICONS: Record<string, ReactNode> = {
    Bug: (
        <span title="Bug" className="inline-flex items-center">
            <Bug size={16} className="text-red-500 shrink-0" />
        </span>
    ),
    Task: (
        <span title="Task" className="inline-flex items-center">
            <CheckSquare size={16} className="text-blue-500 shrink-0" />
        </span>
    ),
    Story: (
        <span title="Story" className="inline-flex items-center">
            <Bookmark size={16} className="text-emerald-500 fill-emerald-500 shrink-0" />
        </span>
    ),
    Epic: (
        <span title="Epic" className="inline-flex items-center">
            <Layers size={16} className="text-purple-500 shrink-0" />
        </span>
    ),
};

// 2. Öncelik İkonları
const PRIORITY_ICONS: Record<string, ReactNode> = {
    Highest: (
        <span title="Highest" className="inline-flex items-center">
            <ArrowUp size={15} className="text-red-600 stroke-[3] shrink-0" />
        </span>
    ),
    High: (
        <span title="High" className="inline-flex items-center">
            <ArrowUp size={15} className="text-red-500 shrink-0" />
        </span>
    ),
    Medium: (
        <span title="Medium" className="inline-flex items-center">
            <Minus size={15} className="text-amber-500 stroke-[3] shrink-0" />
        </span>
    ),
    Low: (
        <span title="Low" className="inline-flex items-center">
            <ArrowDown size={15} className="text-blue-500 shrink-0" />
        </span>
    ),
    Lowest: (
        <span title="Lowest" className="inline-flex items-center">
            <ArrowDown size={15} className="text-slate-400 shrink-0" />
        </span>
    ),
};

export function BacklogPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const user = useAuthStore((state) => state.user);
    const isPM = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const { page, setPage, pageSize, reset: resetPagination } = usePagination(25);

    const { data: backlogTasks, isLoading } = useBacklog(selectedProjectId, page, pageSize);
    const { activeSprint, sprints } = useActiveSprint(selectedProjectId);
    const moveToSprint = useMoveToSprint(selectedProjectId ?? '');
    const completeSprint = useCompleteSprint(selectedProjectId ?? '');

    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
    const [isCreateSprintOpen, setCreateSprintOpen] = useState(false);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOverSprint, setDragOverSprint] = useState(false);

    useEffect(() => {
        resetPagination();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId]);

    if (!selectedProjectId) {
        return <p className="text-secondary text-xs p-5">Devam etmek için üstten bir proje seçin.</p>;
    }

    const handleMoveToSprint = async (taskId: string) => {
        if (!activeSprint) return;
        setError(null);
        try {
            await moveToSprint.mutateAsync({ taskId, sprintId: activeSprint.id });
        } catch {
            setError("Bu görevi sprint'e taşıma yetkiniz yok.");
        }
    };

    // Sürükle - Bırak İşleyicileri
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDropOnSprint = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverSprint(false);
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        if (!activeSprint) {
            setError('Görevi taşıyabileceğin aktif bir sprint yok.');
            return;
        }
        await handleMoveToSprint(taskId);
    };

    const handleCompleteSprint = async () => {
        if (!activeSprint) return;
        const ok = await confirm(
            "Sprint'i Tamamla",
            `"${activeSprint.name}" sprintini tamamlamak istediğinize emin misiniz? Tamamlanmamış görevler Backlog'a geri dönecek.`,
            true
        );
        if (!ok) return;
        try {
            await completeSprint.mutateAsync(activeSprint.id);
        } catch {
            setError('Sprint tamamlanamadı.');
        }
    };

    const completedSprints = sprints?.filter((s) => s.status === 'Completed') ?? [];

    return (
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-4 space-y-5 select-none">
            {/* Üst Başlık ve Aksiyonlar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
                <div>
                    <h1 className="text-xl font-semibold text-primary">Backlog</h1>
                    <p className="text-xs text-secondary mt-0.5">
                        Proje backlog'undaki görevleri planlayın ve sprintlere dağıtın.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {!activeSprint && isPM && (
                        <button
                            onClick={() => setCreateSprintOpen(true)}
                            className="border border-gray-300 dark:border-gray-600 surface hover:bg-gray-50 dark:hover:bg-gray-700 text-secondary px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                            <span>Sprint Başlat</span>
                        </button>
                    )}
                    <button
                        onClick={() => setCreateTaskOpen(true)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Oluştur</span>
                    </button>
                </div>
            </div>

            {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

            {/* Aktif Sprint Kartı (Sürükleme Hedefi) */}
            {activeSprint && (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSprint(true);
                    }}
                    onDragLeave={() => setDragOverSprint(false)}
                    onDrop={handleDropOnSprint}
                    className={`surface border rounded-md p-3 shadow-2xs space-y-2 transition-colors ${isDragOverSprint
                        ? 'ring-2 ring-indigo-400 dark:ring-indigo-600 bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700'
                        : 'border-gray-300 dark:border-gray-700'
                        }`}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    <Play className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                                    <span>Active Sprint</span>
                                </span>
                                <Link
                                    to={`/sprints/${activeSprint.id}`}
                                    className="font-bold text-sm text-primary hover:text-blue-600 hover:underline transition"
                                >
                                    {activeSprint.name}
                                </Link>
                            </div>

                            {activeSprint.goal && (
                                <p className="text-xs text-secondary leading-normal">{activeSprint.goal}</p>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-muted font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(activeSprint.startDate).toLocaleDateString('tr-TR')} —{' '}
                                    {new Date(activeSprint.endDate).toLocaleDateString('tr-TR')}
                                </span>
                                <span>•</span>
                                <span>{activeSprint.taskCount} görev</span>
                                <span>•</span>
                                <span className="font-bold text-secondary">{activeSprint.totalStoryPoints} SP</span>
                            </div>
                        </div>

                        {isPM && (
                            <button
                                onClick={handleCompleteSprint}
                                className="border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md px-3 py-1.5 text-xs font-semibold self-start sm:self-auto transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Sprint'i Tamamla</span>
                            </button>
                        )}
                    </div>
                    {isDragOverSprint && (
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-1">
                            Bırakınca sprint'e taşınacak...
                        </p>
                    )}
                </div>
            )}

            {/* Backlog Başlığı ve Gruplanmış Görev Listesi */}
            <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-1.5">
                    <h2 className="font-semibold text-xs text-secondary uppercase tracking-wider">
                        Backlog {backlogTasks && `(${backlogTasks.length})`}
                    </h2>
                </div>

                {isLoading ? (
                    <p className="text-secondary text-xs py-4">Yükleniyor...</p>
                ) : !backlogTasks || backlogTasks.length === 0 ? (
                    <div className="surface border rounded-md p-8 text-center text-muted text-xs space-y-2">
                        <Inbox className="w-10 h-10 text-muted mx-auto" />
                        <p className="font-medium text-primary">No issues found</p>
                        <p className="text-[11px] text-muted">
                            Backlog boş. Tüm görevler sprintlere atanmış olabilir.
                        </p>
                    </div>
                ) : (
                    <>
                        <BacklogGroupedList
                            tasks={backlogTasks}
                            isPM={isPM}
                            hasActiveSprint={!!activeSprint}
                            onMoveToSprint={handleMoveToSprint}
                            onDragStart={handleDragStart}
                        />
                        <PaginationBar
                            page={page}
                            onPageChange={setPage}
                            hasNextPage={backlogTasks.length === pageSize}
                            totalOnPage={backlogTasks.length}
                        />
                    </>
                )}
            </div>

            {/* Geçmiş Sprintler Akordeon Paneli */}
            {completedSprints.length > 0 && (
                <div className="surface border rounded-md overflow-hidden shadow-2xs">
                    <button
                        onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-xs font-semibold text-secondary transition cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Archive className="w-4 h-4 text-muted" />
                            <span>Completed Sprints ({completedSprints.length})</span>
                        </div>
                        {isArchiveOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {isArchiveOpen && (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800 px-3 py-1">
                            {completedSprints.map((s) => (
                                <li key={s.id} className="py-2">
                                    <Link
                                        to={`/sprints/${s.id}`}
                                        className="text-xs font-medium text-secondary hover:text-blue-600 hover:underline flex items-center justify-between transition"
                                    >
                                        <span>{s.name}</span>
                                        <span className="text-muted font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-bold">
                                            {s.totalStoryPoints} SP
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <CreateTaskModal
                projectId={selectedProjectId}
                sprintId={null}
                isOpen={isCreateTaskOpen}
                onClose={() => setCreateTaskOpen(false)}
            />
            <CreateSprintModal
                projectId={selectedProjectId}
                isOpen={isCreateSprintOpen}
                onClose={() => setCreateSprintOpen(false)}
            />

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                danger={confirmState.danger}
                confirmLabel="Tamamla"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// Jira Stili Sıkıştırılmış Satır Yapısı (Compact Table Row List)
// ----------------------------------------------------------------------

const TASKS_PER_GROUP_LIMIT = 25;

function BoundedTaskList({
    tasks,
    renderTask,
}: {
    tasks: BacklogTaskItem[];
    renderTask: (t: BacklogTaskItem) => ReactNode;
}) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? tasks : tasks.slice(0, TASKS_PER_GROUP_LIMIT);
    const hiddenCount = tasks.length - visible.length;
    return (
        <>
            {visible.map(renderTask)}
            {hiddenCount > 0 && (
                <button
                    onClick={() => setExpanded(true)}
                    className="w-full text-xs text-indigo-600 dark:text-indigo-400 hover:underline py-1"
                >
                    + {hiddenCount} görev daha göster
                </button>
            )}
        </>
    );
}

function BacklogGroupedList({
    tasks,
    isPM,
    hasActiveSprint,
    onMoveToSprint,
    onDragStart,
}: {
    tasks: BacklogTaskItem[];
    isPM: boolean;
    hasActiveSprint: boolean;
    onMoveToSprint: (taskId: string) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
}) {
    const grouped = tasks.reduce<Record<string, BacklogTaskItem[]>>((acc, t) => {
        const key = t.parentTaskId ?? '__none__';
        (acc[key] ??= []).push(t);
        return acc;
    }, {});

    const noEpicTasks = grouped['__none__'] ?? [];
    const epicGroups = Object.entries(grouped).filter(([key]) => key !== '__none__');

    const renderTaskRow = (task: BacklogTaskItem) => {
        return (
            <div
                key={task.id}
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
                className="flex items-center justify-between px-3 h-11 border border-gray-200/80 dark:border-gray-700/80 rounded-md surface hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-gray-300 dark:hover:border-gray-600 transition group text-xs text-primary space-x-3 cursor-move"
            >
                {/* Sol Taraf: İkon + Key + Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {ISSUE_ICONS[task.issueType] ?? <CheckSquare size={16} className="text-blue-500 shrink-0" />}

                    <span className="font-mono text-[11px] text-muted font-semibold shrink-0">
                        {`#${task.id.slice(0, 5)}`}
                    </span>

                    <Link
                        to={`/tasks/${task.id}`}
                        className="font-medium text-primary hover:text-blue-600 truncate flex-1 leading-tight cursor-pointer"
                    >
                        {task.title}
                    </Link>
                </div>

                {/* Sağ Taraf: Priority + SP + Assignee + Sprint Move Button */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Priority Icon */}
                    <div title={task.priority} className="flex items-center">
                        {PRIORITY_ICONS[task.priority] ?? <Minus size={15} className="text-muted shrink-0" />}
                    </div>

                    {/* Story Point Badge */}
                    {task.storyPoint !== null && task.storyPoint !== undefined ? (
                        <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-secondary border border-gray-200 dark:border-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {task.storyPoint}
                        </span>
                    ) : (
                        <span className="text-muted text-xs shrink-0">-</span>
                    )}

                    {/* Assignee Avatar */}
                    {task.assigneeName ? (
                        <Avatar
                            userId={task.assigneeId}
                            name={task.assigneeName}
                            size="sm"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-muted text-[9px] font-bold flex items-center justify-center">
                            ?
                        </div>
                    )}

                    {/* Sprint'e Taşı Butonu (Sadece İkon) */}
                    {isPM && hasActiveSprint && (
                        <button
                            onClick={() => onMoveToSprint(task.id)}
                            className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950 text-secondary hover:text-blue-600 transition cursor-pointer shrink-0"
                            title="Sprint'e Taşı"
                        >
                            <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Epic Grupları */}
            {epicGroups.map(([epicId, epicTasks]) => (
                <div key={epicId} className="space-y-1">
                    {/* Epic Header Badge */}
                    <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-md px-3 py-1.5 flex items-center gap-2 text-xs text-purple-900 dark:text-purple-300 font-bold">
                        <Package size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>{epicTasks[0].parentTaskTitle ?? 'Epic'}</span>
                        <span className="text-[10px] text-purple-400 dark:text-purple-500 font-semibold">
                            ({epicTasks.length})
                        </span>
                    </div>

                    {/* Epic İçindeki Tasklar */}
                    <div className="ml-4 sm:ml-6 space-y-1">
                        <BoundedTaskList tasks={epicTasks} renderTask={renderTaskRow} />
                    </div>
                </div>
            ))}

            {/* Epic'e Bağlı Olmayan Görevler */}
            {noEpicTasks.length > 0 && (
                <div className="space-y-1">
                    {epicGroups.length > 0 && (
                        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider pt-2 px-1">
                            Diğer Görevler
                        </p>
                    )}
                    <BoundedTaskList tasks={noEpicTasks} renderTask={renderTaskRow} />
                </div>
            )}
        </div>
    );
}