import { Link } from 'react-router-dom';
import { useTasks } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';

const PRIORITY_COLORS: Record<string, string> = {
    Low: 'bg-gray-100 dark:bg-gray-700 text-secondary',
    Medium: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    High: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
    Critical: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
};

const taskDetailUrl = (issueKey: string) => `/browse/${issueKey}`;

export function MyOpenTasksWidget({ projectId }: { projectId: string }) {
    const currentUser = useAuthStore((state) => state.user);
    const { data: tasks, isLoading } = useTasks(projectId, { assigneeId: currentUser?.userId });

    const openTasks = (tasks ?? []).filter((t) => t.status !== 'Done' && t.status !== 'Closed').slice(0, 8);

    if (isLoading) return <p className="text-sm text-muted">Yükleniyor...</p>;
    if (openTasks.length === 0) return <p className="text-sm text-muted">Bu projede size atanmış açık görev yok.</p>;

    return (
        <ul className="space-y-1.5">
            {openTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                    <Link to={taskDetailUrl(t.issueKey)} className="text-indigo-600 dark:text-indigo-400 hover:underline truncate flex-1">
                        <span className="text-xs text-muted font-mono mr-1.5">{t.issueKey}</span>
                        {t.title}
                    </Link>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-2 ${PRIORITY_COLORS[t.priority] ?? ''}`}>{t.priority}</span>
                </li>
            ))}
        </ul>
    );
}