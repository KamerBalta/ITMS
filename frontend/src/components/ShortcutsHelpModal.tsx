import { Modal } from './Modal';

const SHORTCUTS = [
    { keys: 'Ctrl + K', desc: 'Arama' },
    { keys: 'C', desc: 'Yeni görev oluştur' },
    { keys: 'G → B', desc: 'Board sayfasına git' },
    { keys: 'G → P', desc: 'Projeler sayfasına git' },
    { keys: 'G → L', desc: 'Backlog sayfasına git' },
    { keys: 'G → I', desc: 'Issue Listesi sayfasına git' },
];

export function ShortcutsHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <Modal title="Klavye Kısayolları" isOpen={isOpen} onClose={onClose}>
            <div className="space-y-2">
                {SHORTCUTS.map((s) => (
                    <div key={s.keys} className="flex items-center justify-between text-sm">
                        <span className="text-secondary">{s.desc}</span>
                        <kbd className="text-xs bg-gray-100 dark:bg-gray-700 text-secondary px-2 py-1 rounded font-mono">{s.keys}</kbd>
                    </div>
                ))}
            </div>
        </Modal>
    );
}