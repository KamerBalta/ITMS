import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useBacklog, useMoveToSprint } from '../../hooks/useBacklog';
import { useActiveSprint, useCompleteSprint } from '../../hooks/useSprints';
import { TaskCard } from '../../components/TaskCard';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { CreateSprintModal } from '../../components/CreateSprintModal';

export function BacklogPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const user = useAuthStore((state) => state.user);
    const isPM = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const { data: backlogTasks, isLoading } = useBacklog(selectedProjectId);
    const { activeSprint, sprints } = useActiveSprint(selectedProjectId);
    const moveToSprint = useMoveToSprint(selectedProjectId ?? '');
    const completeSprint = useCompleteSprint(selectedProjectId ?? '');

    const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
    const [isCreateSprintOpen, setCreateSprintOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!selectedProjectId) {
        return <p className="text-gray-500">Devam etmek için üstten bir proje seçin.</p>;
    }

    const handleMoveToSprint = async (taskId: string) => {
        if (!activeSprint) return;
        setError(null);
        try {
            await moveToSprint.mutateAsync({ taskId, sprintId: activeSprint.id });
        } catch {
            setError('Bu görevi sprint\'e taşıma yetkiniz yok.');
        }
    };

    const handleCompleteSprint = async () => {
        if (!activeSprint) return;
        if (!confirm(`"${activeSprint.name}" sprintini tamamlamak istediğinize emin misiniz? Tamamlanmamış görevler Backlog'a geri dönecek.`)) return;
        try {
            await completeSprint.mutateAsync(activeSprint.id);
        } catch {
            setError('Sprint tamamlanamadı.');
        }
    };

    return (
        <div className="grid grid-cols-3 gap-6">
            {/* Sol: Backlog listesi */}
            <div className="col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Backlog</h1>
                    <button
                        onClick={() => setCreateTaskOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                    >
                        + Görev Oluştur
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                {isLoading ? (
                    <p className="text-gray-500">Yükleniyor...</p>
                ) : !backlogTasks || backlogTasks.length === 0 ? (
                    <p className="text-gray-400 text-sm">Backlog boş.</p>
                ) : (
                    <div className="space-y-2">
                        {backlogTasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-2">
                                <div className="flex-1">
                                    <TaskCard task={task} projectId={selectedProjectId} />
                                </div>
                                {isPM && activeSprint && (
                                    <button
                                        onClick={() => handleMoveToSprint(task.id)}
                                        className="text-xs text-indigo-600 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50 whitespace-nowrap"
                                    >
                                        Sprint'e Taşı →
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sag: Sprint paneli */}
            <div className="space-y-4">
                <div className="bg-white border rounded-lg p-4">
                    <h2 className="font-semibold mb-3">Aktif Sprint</h2>

                    {activeSprint ? (
                        <div className="space-y-2">
                            <p className="font-medium">{activeSprint.name}</p>
                            {activeSprint.goal && <p className="text-sm text-gray-500">{activeSprint.goal}</p>}
                            <p className="text-xs text-gray-400">
                                {new Date(activeSprint.startDate).toLocaleDateString('tr-TR')} —{' '}
                                {new Date(activeSprint.endDate).toLocaleDateString('tr-TR')}
                            </p>
                            <p className="text-xs text-gray-400">
                                {activeSprint.taskCount} görev · {activeSprint.totalStoryPoints} SP
                            </p>

                            {isPM && (
                                <button
                                    onClick={handleCompleteSprint}
                                    className="w-full mt-3 border border-red-200 text-red-600 py-1.5 rounded text-sm hover:bg-red-50"
                                >
                                    Sprint'i Tamamla
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-400 mb-3">Aktif sprint yok.</p>
                            {isPM && (
                                <button
                                    onClick={() => setCreateSprintOpen(true)}
                                    className="w-full bg-indigo-600 text-white py-1.5 rounded text-sm hover:bg-indigo-700"
                                >
                                    + Sprint Başlat
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {sprints && sprints.filter((s) => s.status === 'Completed').length > 0 && (
                    <div className="bg-white border rounded-lg p-4">
                        <h2 className="font-semibold mb-2 text-sm">Geçmiş Sprintler</h2>
                        <ul className="space-y-1">
                            {sprints
                                .filter((s) => s.status === 'Completed')
                                .map((s) => (
                                    <li key={s.id} className="text-xs text-gray-500">
                                        {s.name} — {s.totalStoryPoints} SP
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </div>

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
        </div>
    );
}