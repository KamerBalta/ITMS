interface PaginationBarProps {
    page: number;
    onPageChange: (page: number) => void;
    hasNextPage: boolean;
    totalOnPage: number;
}

export function PaginationBar({ page, onPageChange, hasNextPage, totalOnPage }: PaginationBarProps) {
    if (page === 1 && !hasNextPage) return null;

    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
                Sayfa {page} · {totalOnPage} kayıt
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-30 hover-surface text-secondary cursor-pointer"
                >
                    ← Önceki
                </button>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNextPage}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-30 hover-surface text-secondary cursor-pointer"
                >
                    Sonraki →
                </button>
            </div>
        </div>
    );
}