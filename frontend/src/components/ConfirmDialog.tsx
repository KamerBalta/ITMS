interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Onayla', danger, onConfirm, onCancel }: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="surface rounded-lg shadow-lg w-full max-w-sm p-6 border">
                <h2 className="text-lg font-semibold mb-2 text-primary">{title}</h2>
                <p className="text-sm text-muted mb-5">{message}</p>
                <div className="flex gap-2 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover-surface text-secondary">
                        İptal
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm rounded text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}