export function SkeletonBlock({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className ?? 'h-4 w-full'}`} />;
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
    return (
        <div className="surface border rounded-lg p-4 space-y-2">
            <SkeletonBlock className="h-3 w-1/3" />
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBlock key={i} className="h-6 w-2/3" />
            ))}
        </div>
    );
}