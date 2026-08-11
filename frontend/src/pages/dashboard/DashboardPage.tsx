import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useDashboardSummary, useWorkload, useVelocity, useBurndown } from '../../hooks/useDashboard';
import { useActiveSprint } from '../../hooks/useSprints';
import { VelocityChart } from '../../components/VelocityChart';
import { BurndownChart } from '../../components/BurndownChart';

const STATUS_COLORS: Record<string, string> = {
    toDoCount: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
    inProgressCount: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    readyForReviewCount: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
    readyForQACount: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    doneCount: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
};

const STATUS_LABELS: Record<string, string> = {
    toDoCount: 'To Do',
    inProgressCount: 'In Progress',
    readyForReviewCount: 'Ready for Review',
    readyForQACount: 'Ready for QA',
    doneCount: 'Done',
};

export function DashboardPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const { data: summary, isLoading: summaryLoading } = useDashboardSummary(selectedProjectId);
    const { data: workload, isLoading: workloadLoading } = useWorkload(selectedProjectId);
    const { data: velocity } = useVelocity(selectedProjectId);
    const { activeSprint } = useActiveSprint(selectedProjectId);
    const { data: burndown } = useBurndown(activeSprint?.id ?? null);
    const [showVelocity, setShowVelocity] = useState(true);

    if (!selectedProjectId) {
        return <p className="text-muted">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (summaryLoading) {
        return <p className="text-muted">Yükleniyor...</p>;
    }

    if (!summary) {
        return <p className="text-red-500">Dashboard verisi alınamadı.</p>;
    }

    const statusKeys = ['toDoCount', 'inProgressCount', 'readyForReviewCount', 'readyForQACount', 'doneCount'] as const;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
                <p className="text-sm text-muted">Size atanmış görevlerin özeti</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statusKeys.map((key) => (
                    <div key={key} className={`rounded-lg p-4 ${STATUS_COLORS[key]}`}>
                        <p className="text-sm font-medium">{STATUS_LABELS[key]}</p>
                        <p className="text-2xl font-bold mt-1">{summary[key]}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="surface border rounded-lg p-4">
                    <p className="text-sm text-muted">Toplam Görev</p>
                    <p className="text-2xl font-bold text-primary">{summary.totalTasks}</p>
                </div>
                <div className="surface border rounded-lg p-4">
                    <p className="text-sm text-muted">Geciken Görev</p>
                    <p className={`text-2xl font-bold ${summary.overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
                        {summary.overdueCount}
                    </p>
                </div>
                <div className="surface border rounded-lg p-4">
                    <p className="text-sm text-muted">Aktif Sprint</p>
                    {summary.activeSprintName ? (
                        <>
                            <p className="text-lg font-semibold text-primary">{summary.activeSprintName}</p>
                            <p className="text-xs text-muted">
                                Bitiş: {summary.activeSprintEndDate ? new Date(summary.activeSprintEndDate).toLocaleDateString('tr-TR') : '-'}
                                {' · '}
                                {summary.activeSprintTaskCount} görev
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-muted">Aktif sprint yok</p>
                    )}
                </div>
            </div>

            {burndown && (
                <div className="surface border rounded-lg p-4">
                    <h2 className="font-semibold mb-3 text-primary">
                        Burndown Chart —{' '}
                        <Link to={`/sprints/${activeSprint?.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                            {burndown.sprintName}
                        </Link>
                    </h2>
                    <BurndownChart data={burndown} />
                </div>
            )}

            <div className="surface border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-primary">Velocity (Tamamlanan Sprint'ler)</h2>
                    <button onClick={() => setShowVelocity((v) => !v)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        {showVelocity ? 'Gizle' : 'Göster'}
                    </button>
                </div>
                {showVelocity && <VelocityChart data={velocity ?? []} />}
            </div>

            <div className="surface border rounded-lg p-4">
                <h2 className="font-semibold mb-3 text-primary">Takım İş Yükü</h2>
                {workloadLoading ? (
                    <p className="text-sm text-muted">Yükleniyor...</p>
                ) : !workload || workload.length === 0 ? (
                    <p className="text-sm text-muted">Şu anda kimseye atanmış aktif görev yok.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted border-b border-gray-200 dark:border-gray-700">
                                    <th className="py-2">Kullanıcı</th>
                                    <th className="py-2">Açık Görev</th>
                                    <th className="py-2">Toplam Story Point</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workload.map((w) => (
                                    <tr key={w.userId} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                        <td className="py-2 text-secondary">{w.userName}</td>
                                        <td className="py-2 text-secondary">{w.taskCount}</td>
                                        <td className="py-2 text-secondary">{w.totalStoryPoints}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}