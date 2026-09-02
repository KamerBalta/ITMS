import { Link } from 'react-router-dom';
import { useMyTasksBoard } from '../hooks/useMyTasksBoard';
import type { MyTaskBoardItem } from '../types/myTasksBoard';

const CATEGORY_LABELS: Record<string, string> = { ToDo: 'Yapılacak', InProgress: 'Devam Ediyor', Done: 'Tamamlandı' };
const CATEGORY_ORDER = ['ToDo', 'InProgress', 'Done'];

const PRIORITY_COLORS: Record<string, string> = {
    Low: 'bg-gray-100 dark:bg-gray-700 text-secondary',
    Medium: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    High: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
    Critical: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
};

export function MyWorkBoardView() {
    const { data: tasks, isLoading } = useMyTasksBoard();

    if (isLoading) return <p className="text-muted">Yükleniyor...</p>;
    if (!tasks || tasks.length === 0) return <p className="text-sm text-muted">Şu anda size atanmış açık bir görev yok.</p>;

    const grouped = tasks.reduce<Record<string, MyTaskBoardItem[]>>((acc, t) => {
        (acc[t.statusCategory] ??= []).push(t);
        return acc;
    }, {});

    return (
        <div>
            <p className="text-xs text-muted mb-3">
                Tüm projelerdeki açık görevleriniz, gerçek durum adlarından bağımsız olarak genel bir kategoriye göre gruplanmıştır.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CATEGORY_ORDER.map((category) => {
                    const colTasks = grouped[category] ?? [];
                    return (
                        <div key={category} className="bg-gray-100 dark:bg-gray-900 rounded-lg p-2 min-h-[200px]">
                            <div className="flex items-center justify-between px-1 mb-2">
                                <span className="text-xs font-semibold text-secondary">{CATEGORY_LABELS[category]}</span>
                                <span className="text-xs text-muted">{colTasks.length}</span>
                            </div>
                            <div className="space-y-2">
                                {colTasks.map((task) => (
                                    <Link key={task.id} to={`/tasks/${task.id}`} className="block surface border rounded-md p-3 hover:shadow dark:hover:shadow-black/30">
                                        <p className="text-xs text-muted font-mono">{task.issueKey}</p>
                                        <p className="text-sm font-medium text-primary line-clamp-2 my-1">{task.title}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-indigo-600 dark:text-indigo-400 truncate">{task.projectName}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${PRIORITY_COLORS[task.priority] ?? ''}`}>{task.priority}</span>
                                        </div>
                                        <p className="text-[10px] text-muted mt-1">{task.statusName}</p>
                                    </Link>
                                ))}
                                {colTasks.length === 0 && <p className="text-xs text-muted text-center py-4">Görev yok</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}