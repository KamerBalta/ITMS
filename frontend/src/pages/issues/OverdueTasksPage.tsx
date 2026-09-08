import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useTasks } from '../../hooks/useTasks';
import { taskDetailUrl } from '../../lib/taskUrl';

const PRIORITY_COLORS: Record<string, string> = {
    Low: 'bg-gray-100 dark:bg-gray-700 text-secondary',
    Medium: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    High: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
    Critical: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
};

function daysOverdue(dueDate: string): number {
    // "YYYY-MM-DD" parsing
    const [year, month, day] = dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

function formatDueDate(dueDate: string): string {
    const [year, month, day] = dueDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('tr-TR');
}

export function OverdueTasksPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const currentUser = useAuthStore((state) => state.user);

    console.log('CURRENT USER:', currentUser);
    console.log('CURRENT USER ID:', currentUser?.userId);

    const { data: tasks, isLoading } = useTasks(selectedProjectId, {
        assigneeId: currentUser?.userId,
        overdueOnly: true,
        pageSize: 100,
    });

    if (!selectedProjectId) return <p className="text-muted">Devam etmek için üstten bir proje seçin.</p>;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-primary">Geciken Görevler</h1>
                <p className="text-sm text-muted">Size atanmış, teslim tarihi geçmiş ve henüz tamamlanmamış görevler.</p>
            </div>

            {isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : !tasks || tasks.length === 0 ? (
                <p className="text-sm text-muted">Geciken göreviniz yok. 🎉</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm surface border rounded-lg overflow-hidden">
                        <thead>
                            <tr className="text-left text-secondary surface-muted">
                                <th className="px-3 py-2">Başlık</th>
                                <th className="px-3 py-2">Öncelik</th>
                                <th className="px-3 py-2">Durum</th>
                                <th className="px-3 py-2">Teslim Tarihi</th>
                                <th className="px-3 py-2">Gecikme</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((t) => (
                                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800 hover-surface">
                                    <td className="px-3 py-2">
                                        <Link to={taskDetailUrl(t.issueKey)} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                            <span className="text-xs text-muted font-mono mr-1.5">{t.issueKey}</span>{t.title}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[t.priority] ?? ''}`}>{t.priority}</span>
                                    </td>
                                    <td className="px-3 py-2 text-secondary">{t.status}</td>
                                    <td className="px-3 py-2 text-secondary">
                                        {t.dueDate ? formatDueDate(t.dueDate) : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-red-600 dark:text-red-400 font-medium">
                                        {t.dueDate ? `${daysOverdue(t.dueDate)} gün` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}