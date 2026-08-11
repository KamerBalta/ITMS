import type { ReactNode } from 'react';

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export function Modal({ title, isOpen, onClose, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="surface rounded-t-lg sm:rounded-lg shadow-lg w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-6 border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-primary">{title}</h2>
                    <button onClick={onClose} className="text-muted hover:text-secondary">
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}