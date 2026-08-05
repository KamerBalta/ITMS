import { useAuthStore } from '../../../store/authStore';
import { useWatchers, useToggleWatch } from '../../../hooks/useTaskDetail';

export function WatchersSection({ taskId, watcherCount }: { taskId: string; watcherCount: number }) {
    const currentUser = useAuthStore((state) => state.user);
    const { data: watchers } = useWatchers(taskId);
    const isWatching = watchers?.some((w) => w.userId === currentUser?.userId) ?? false;
    const toggleWatch = useToggleWatch(taskId);

    console.log("Current User:", currentUser);
    console.log("Watchers:", watchers);
    console.log("isWatching:", isWatching);

    return (
        <div className="flex items-center justify-between bg-white border rounded-lg p-3">
            <span className="text-sm text-gray-500">👁️ {watchers?.length ?? watcherCount} kişi izliyor</span>
            <button
                onClick={() => toggleWatch.mutate(isWatching)}
                className={`text-sm px-3 py-1 rounded border ${isWatching ? 'border-indigo-300 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600'
                    }`}
            >
                {isWatching ? 'İzlemeyi Bırak' : 'İzle'}
            </button>
        </div>
    );
}