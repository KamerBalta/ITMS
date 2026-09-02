import { Avatar } from '../../../components/Avatar';
import { useAuthStore } from '../../../store/authStore';
import { useWatchers, useToggleWatch } from '../../../hooks/useTaskDetail';
import { SkeletonBlock } from '../../../components/Skeleton';

export function WatchersSection({
    taskId,
    watcherCount,
}: {
    taskId: string;
    watcherCount: number;
}) {
    const currentUser = useAuthStore((state) => state.user);

    const { data: watchers, isLoading: watchersLoading } = useWatchers(taskId);

    const isWatching =
        watchers?.some((w) => w.userId === currentUser?.userId) ?? false;

    const toggleWatch = useToggleWatch(taskId);

    if (watchersLoading) {
        return <SkeletonBlock className="h-16 w-full rounded-lg" />;
    }

    const handleToggleWatch = () => {
        toggleWatch.mutate(isWatching);
    };

    return (
        <div className="surface border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">
                    👁️ {watchers?.length ?? watcherCount} kişi izliyor
                </span>

                <button
                    onClick={handleToggleWatch}
                    disabled={toggleWatch.isPending}
                    className={`text-sm px-3 py-1 rounded border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isWatching
                            ? 'border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                            : 'border-gray-200 dark:border-gray-600 text-secondary'
                        }`}
                >
                    {toggleWatch.isPending
                        ? 'İşleniyor...'
                        : isWatching
                            ? 'İzlemeyi Bırak'
                            : 'İzle'}
                </button>
            </div>

            {watchers && watchers.length > 0 && (
                <div className="flex -space-x-2">
                    {watchers.map((w) => (
                        <div
                            key={w.userId}
                            className="ring-2 ring-white dark:ring-gray-800 rounded-full"
                        >
                            <Avatar
                                userId={w.userId}
                                name={w.userName}
                                size="sm"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}