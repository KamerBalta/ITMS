import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useTasks, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useActiveSprint } from '../../hooks/useSprints';
import { TaskCard } from '../../components/TaskCard';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { BOARD_COLUMNS, STATUS_TO_INT } from '../../lib/taskStatus';
import type { ItemStatus } from '../../types/task';

export function KanbanBoardPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const { activeSprint } = useActiveSprint(selectedProjectId);
    const { data: tasks, isLoading } = useTasks(selectedProjectId, activeSprint?.id ?? undefined, false);
    const updateStatus = useUpdateTaskStatus(selectedProjectId ?? '');
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [dragOverColumn, setDragOverColumn] = useState<ItemStatus | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);

    if (!selectedProjectId) {
        return <p className="text-gray-500">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (!activeSprint) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500">Bu projede aktif bir sprint yok.</p>
                <p className="text-sm text-gray-400 mt-1">Board'u kullanabilmek için önce Backlog sayfasından bir sprint başlatın.</p>
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Kanban Board</h1>
                    <p className="text-sm text-gray-400">{activeSprint.name}</p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                >
                    + Görev Oluştur
                </button>
            </div>

            {statusError && <p className="text-red-500 text-sm">{statusError}</p>}

            {isLoading ? (
                <p className="text-gray-500">Yükleniyor...</p>
            ) : (
                <div className="grid grid-cols-5 gap-3">
                    {BOARD_COLUMNS.map((col) => {
                        const columnTasks = tasks?.filter((t) => t.status === col.status) ?? [];
                        return (
                            <div
                                key={col.status}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverColumn(col.status);
                                }}
                                onDragLeave={() => setDragOverColumn(null)}
                                onDrop={(e) => handleDrop(e, col.status)}
                                className={`bg-gray-100 rounded-lg p-2 min-h-[400px] transition-colors ${dragOverColumn === col.status ? 'bg-indigo-50 ring-2 ring-indigo-300' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between px-1 mb-2">
                                    <span className="text-xs font-semibold text-gray-500">{col.label}</span>
                                    <span className="text-xs text-gray-400">{columnTasks.length}</span>
                                </div>

                                <div className="space-y-2">
                                    {columnTasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            projectId={selectedProjectId}
                                            draggable
                                            onDragStart={handleDragStart}
                                        />
                                    ))}
                                    {columnTasks.length === 0 && (
                                        <p className="text-xs text-gray-300 text-center py-4">Görev yok</p>
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