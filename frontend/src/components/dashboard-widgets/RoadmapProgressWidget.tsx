import { Link } from 'react-router-dom';
import { useRoadmap } from '../../hooks/useRoadmap';

export function RoadmapProgressWidget({ projectId }: { projectId: string }) {
    const { data, isLoading } = useRoadmap(projectId);
    const epics = (data?.epics ?? []).filter((e) => e.totalTasks > 0).slice(0, 6);

    if (isLoading) return <p className="text-sm text-muted">Yükleniyor...</p>;
    if (epics.length === 0) return <p className="text-sm text-muted">Henüz alt görevleri olan bir Epic yok.</p>;

    return (
        <div className="space-y-2">
            {epics.map((epic) => {
                const pct = Math.round((epic.doneTasks / epic.totalTasks) * 100);
                return (
                    <div key={epic.id}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                            <Link to={`/tasks/${epic.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline truncate">{epic.title}</Link>
                            <span className="text-muted shrink-0 ml-2">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}