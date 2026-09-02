import { useState } from 'react';
import {
    useBoardColumns, useCreateBoardColumn, useUpdateBoardColumn, useDeleteBoardColumn, useReorderBoardColumns,
} from '../hooks/useBoardColumns';

interface BoardColumnEditBarProps {
    projectId: string;
    onClose: () => void;
}

// #8: Board sayfasinin USTUNDE acilan, Kanban goruntusunu bozmadan calisan bir seyrit --
// Board Settings sayfasiyla AYNI hook'lari (dolayisiyla ayni veri kaynagini) kullanir.
// Burada yapilan her degisiklik anlik olarak alttaki Board'a (ayni sayfada, invalidate
// sayesinde) ve diger kullanicilarin ekranina (SignalR sayesinde) yansir.
export function BoardColumnEditBar({ projectId, onClose }: BoardColumnEditBarProps) {
    const { data: columns } = useBoardColumns(projectId);
    const createColumn = useCreateBoardColumn(projectId);
    const updateColumn = useUpdateBoardColumn(projectId);
    const deleteColumn = useDeleteBoardColumn(projectId);
    const reorderColumns = useReorderBoardColumns(projectId);

    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const realColumns = (columns ?? []).filter((c) => c.id !== '00000000-0000-0000-0000-000000000000');
    const sorted = [...realColumns].sort((a, b) => a.displayOrder - b.displayOrder);

    const handleDragStart = (e: React.DragEvent, columnId: string) => {
        setDraggedId(columnId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverId(columnId);
    };

    const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        setDragOverId(null);
        if (!draggedId || draggedId === targetColumnId) return;

        const currentOrder = sorted.map((c) => c.id);
        const fromIndex = currentOrder.indexOf(draggedId);
        const toIndex = currentOrder.indexOf(targetColumnId);
        if (fromIndex === -1 || toIndex === -1) return;

        const newOrder = [...currentOrder];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedId);

        await reorderColumns.mutateAsync(newOrder);
        setDraggedId(null);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setError(null);
        try {
            await createColumn.mutateAsync(newName.trim());
            setNewName('');
        } catch {
            setError('Column oluşturulamadı (bu isim zaten kullanılıyor olabilir).');
        }
    };

    const startEdit = (id: string, name: string) => {
        setEditingId(id);
        setEditName(name);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        await updateColumn.mutateAsync({ id: editingId, name: editName });
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        setError(null);
        if (!confirm("Bu kolonu silmek istediğinize emin misiniz? Kolona atanmış durumlar varsa önce onları başka bir kolona taşımanız gerekir.")) return;
        try {
            await deleteColumn.mutateAsync(id);
        } catch {
            setError('Silinemedi — bu kolona atanmış durumlar var.');
        }
    };

    return (
        <div className="surface border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">Kolonları Düzenle — sürükleyerek sırala</p>
                <button onClick={onClose} className="text-xs text-muted hover:text-secondary">✕ Kapat</button>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex flex-wrap gap-2">
                {sorted.map((col) => (
                    <div
                        key={col.id}
                        draggable={editingId !== col.id}
                        onDragStart={(e) => handleDragStart(e, col.id)}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={(e) => handleDrop(e, col.id)}
                        className={`flex items-center gap-1.5 border rounded-lg px-2 py-1.5 cursor-move transition-colors ${dragOverId === col.id ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-gray-200 dark:border-gray-700'
                            } ${draggedId === col.id ? 'opacity-40' : ''}`}
                    >
                        <span className="text-muted text-xs">⠿</span>
                        {editingId === col.id ? (
                            <>
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                    autoFocus
                                    className="input-base border rounded px-1.5 py-0.5 text-xs w-28"
                                />
                                <button onClick={saveEdit} className="text-xs text-indigo-600 dark:text-indigo-400">✓</button>
                                <button onClick={() => setEditingId(null)} className="text-xs text-muted">✕</button>
                            </>
                        ) : (
                            <>
                                <span className="text-sm text-secondary">{col.name}</span>
                                <button onClick={() => startEdit(col.id, col.name)} className="text-xs text-muted hover:text-indigo-600 dark:hover:text-indigo-400">✎</button>
                                <button onClick={() => handleDelete(col.id)} className="text-xs text-muted hover:text-red-500">🗑</button>
                            </>
                        )}
                    </div>
                ))}

                <div className="flex items-center gap-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        placeholder="+ Yeni kolon"
                        className="input-base border-none bg-transparent text-xs w-24 focus:outline-none"
                    />
                    <button onClick={handleCreate} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Ekle</button>
                </div>
            </div>

            <p className="text-xs text-muted">
                Not: Durumları (Status) bir kolona atamak için Proje Detay → Board Settings sayfasını kullanın. Burası yalnızca kolonların kendisini ve sırasını yönetir.
            </p>
        </div>
    );
}