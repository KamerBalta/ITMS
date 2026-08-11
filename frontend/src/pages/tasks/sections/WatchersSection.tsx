import { Avatar } from '../../../components/Avatar';
import { useAuthStore } from '../../../store/authStore';
import { useWatchers, useToggleWatch } from '../../../hooks/useTaskDetail';

export function WatchersSection({ taskId, watcherCount }: { taskId: string; watcherCount: number }) {
    const currentUser = useAuthStore((state) => state.user);
    const { data: watchers } = useWatchers(taskId);
    const isWatching = watchers?.some((w) => w.userId === currentUser?.userId) ?? false;
    const toggleWatch = useToggleWatch(taskId, isWatching);

    return (
        <div className="bg-white border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">👁️ {watchers?.length ?? watcherCount} kişi izliyor</span>
                <button
                    onClick={() => toggleWatch.mutate()}
                    className={`text-sm px-3 py-1 rounded border ${isWatching ? 'border-indigo-300 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600'
                        }`}
                >
                    {isWatching ? 'İzlemeyi Bırak' : 'İzle'}
                </button>
            </div>
            {watchers && watchers.length > 0 && (
                <div className="flex -space-x-2">
                    {watchers.map((w) => (
                        <div key={w.userId} className="ring-2 ring-white rounded-full">
                            <Avatar userId={w.userId} name={w.userName} size="sm" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}