import type { ReactNode } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    size?: ModalSize;
    children: ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
};

export function Modal({ title, isOpen, onClose, size = '5xl', children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className={`surface rounded-t-lg sm:rounded-lg shadow-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto p-6 border`}>
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