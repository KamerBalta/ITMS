import { useProjectStore } from '../../store/projectStore';
import { useDashboardSummary, useWorkload } from '../../hooks/useDashboard';

const STATUS_COLORS: Record<string, string> = {
    toDoCount: 'bg-gray-100 text-gray-700',
    inProgressCount: 'bg-blue-100 text-blue-700',
    readyForReviewCount: 'bg-yellow-100 text-yellow-700',
    readyForQACount: 'bg-purple-100 text-purple-700',
    doneCount: 'bg-green-100 text-green-700',
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

    if (!selectedProjectId) {
        return <p className="text-gray-500">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (summaryLoading) {
        return <p className="text-gray-500">Yükleniyor...</p>;
    }

    if (!summary) {
        return <p className="text-red-500">Dashboard verisi alınamadı.</p>;
    }

    const statusKeys = ['toDoCount', 'inProgressCount', 'readyForReviewCount', 'readyForQACount', 'doneCount'] as const;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            {/* Durum kartlari */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statusKeys.map((key) => (
                    <div key={key} className={`rounded-lg p-4 ${STATUS_COLORS[key]}`}>
                        <p className="text-sm font-medium">{STATUS_LABELS[key]}</p>
                        <p className="text-2xl font-bold mt-1">{summary[key]}</p>
                    </div>
                ))}
            </div>

            {/* Genel ozet */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-500">Toplam Görev</p>
                    <p className="text-2xl font-bold">{summary.totalTasks}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-500">Geciken Görev</p>
                    <p className={`text-2xl font-bold ${summary.overdueCount > 0 ? 'text-red-600' : ''}`}>
                        {summary.overdueCount}
                    </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-500">Aktif Sprint</p>
                    {summary.activeSprintName ? (
                        <>
                            <p className="text-lg font-semibold">{summary.activeSprintName}</p>
                            <p className="text-xs text-gray-400">
                                Bitiş: {summary.activeSprintEndDate ? new Date(summary.activeSprintEndDate).toLocaleDateString('tr-TR') : '-'}
                                {' · '}
                                {summary.activeSprintTaskCount} görev
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400">Aktif sprint yok</p>
                    )}
                </div>
            </div>

            {/* Takim is yuku */}
            <div className="bg-white border rounded-lg p-4">
                <h2 className="font-semibold mb-3">Takım İş Yükü</h2>
                {workloadLoading ? (
                    <p className="text-sm text-gray-400">Yükleniyor...</p>
                ) : !workload || workload.length === 0 ? (
                    <p className="text-sm text-gray-400">Şu anda kimseye atanmış aktif görev yok.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="py-2">Kullanıcı</th>
                                <th className="py-2">Açık Görev</th>
                                <th className="py-2">Toplam Story Point</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workload.map((w) => (
                                <tr key={w.userId} className="border-b last:border-0">
                                    <td className="py-2">{w.userName}</td>
                                    <td className="py-2">{w.taskCount}</td>
                                    <td className="py-2">{w.totalStoryPoints}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}