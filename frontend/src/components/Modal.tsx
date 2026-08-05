import { useEffect, type ReactNode } from 'react';

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export function Modal({ title, isOpen, onClose, children }: ModalProps) {
    // Esc tuşu ile kapatma desteği
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Modal açıkken arka planın kaydırılmasını engeller
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
            onClick={onClose} // Arka plana tıklayınca kapatma
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col p-5 sm:p-6 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // İçeriğe tıklandığında kapanmasını engelle
            >
                {/* Modal Başlığı */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition"
                        aria-label="Kapat"
                    >
                        ✕
                    </button>
                </div>

                {/* İçerik Alanı (Mobilde dikey kaydırma yapılabilir) */}
                <div className="overflow-y-auto pr-1 flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}