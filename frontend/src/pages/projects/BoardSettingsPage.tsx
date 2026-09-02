import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCanManageProject } from '../../hooks/useCanManageProject';
import {
    useBoardColumns,
    useCreateBoardColumn,
    useUpdateBoardColumn,
    useDeleteBoardColumn,
    useReorderBoardColumns,
    useMapStatusToColumn,
} from '../../hooks/useBoardColumns';
import { useWorkflowStatuses } from '../../hooks/useWorkflow';

export function BoardSettingsPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const canManage = useCanManageProject(projectId ?? null);

    const { data: columns, isLoading } = useBoardColumns(projectId ?? null);
    const { data: statuses } = useWorkflowStatuses(projectId ?? null);
    const createColumn = useCreateBoardColumn(projectId!);
    const updateColumn = useUpdateBoardColumn(projectId!);
    const deleteColumn = useDeleteBoardColumn(projectId!);
    const reorderColumns = useReorderBoardColumns(projectId!);
    const mapStatus = useMapStatusToColumn(projectId!);

    const [error, setError] = useState<string | null>(null);
    const [newColumnName, setNewColumnName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [draggedId, setDraggedId] = useState<string | null>(null);

    if (!projectId) return null;

    const sortedColumns = [...(columns ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const mappedStatusIds = new Set(sortedColumns.flatMap((c) => c.statuses.map((s) => s.id)));

    const unmappedStatuses = (statuses ?? []).filter((s) => !mappedStatusIds.has(s.id));

    const handleMove = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= sortedColumns.length) return;
        const newOrder = [...sortedColumns];
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
        reorderColumns.mutate(newOrder.map((c) => c.id));
    };

    const handleDragStart = (_e: React.DragEvent, id: string) => {
        setDraggedId(id);
    };

    const handleDropReorder = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;
        const currentOrder = sortedColumns.map((c) => c.id);
        const fromIndex = currentOrder.indexOf(draggedId);
        const toIndex = currentOrder.indexOf(targetId);
        const newOrder = [...currentOrder];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedId);
        await reorderColumns.mutateAsync(newOrder);
        setDraggedId(null);
    };

    const handleCreate = async () => {
        if (!newColumnName.trim()) return;
        setError(null);
        try {
            await createColumn.mutateAsync(newColumnName.trim());
            setNewColumnName('');
        } catch {
            setError('Column oluşturulamadı.');
        }
    };

    const startEditing = (id: string, name: string) => {
        setEditingId(id);
        setEditName(name);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        await updateColumn.mutateAsync({ id: editingId, name: editName });
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        setError(null);
        if (!confirm("Bu column'u silmek istediğinize emin misiniz?")) return;
        try {
            await deleteColumn.mutateAsync(id);
        } catch {
            setError("Silinemedi. Bu column'a atanmış durumlar olabilir.");
        }
    };

    const handleAssignStatus = async (statusId: string, columnId: string) => {
        const statusName = statuses?.find((s) => s.id === statusId)?.name ?? 'Bu durum';
        const targetColumnName = columns?.find((c) => c.id === columnId)?.name ?? columnId;
        // #5: Status/Transition değişiklikleri Draft/Publish akışından geçiyor ama Column
        // mapping bu korumaya dahil değil -- bilinçli bir tasarım kararı, çünkü Column'lar
        // "görünüm" katmanı (workflow mantığını değil, sadece gruplamayı etkiler). Yine de
        // bu farkı gizlememek için açık bir onay istiyoruz.
        const confirmed = confirm(
            `"${statusName}" durumu "${targetColumnName}" koluna taşınacak. Bu değişiklik ANINDA etkili olur ve tüm ekibin Board'unu hemen etkiler (Workflow değişikliklerinin aksine, yayınlama beklemez). Devam edilsin mi?`
        );
        if (!confirmed) return;
        await mapStatus.mutateAsync({ statusId, columnId: columnId || null });
    };

    return (
        <div className="max-w-2xl space-y-4">
            <Link to={`/projects/${projectId}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                ← Proje Detayına Dön
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-primary">Board Settings — Columns</h1>
                <p className="text-sm text-muted">
                    Column'lar ile Status'lar birbirinden bağımsızdır. Birden fazla Status aynı Column'da gösterilebilir.
                </p>
            </div>

            <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded px-3 py-2">
                ℹ️ Column ekleme/silme/sıralama ve Status→Column atamaları <strong>anında</strong> etkilidir — Workflow Editörü'ndeki
                Durum/Geçiş değişikliklerinin aksine bir "Yayınla" adımı gerektirmez.
            </p>

            {!canManage && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded px-3 py-2">
                    Bu sayfayı yalnızca görüntüleyebilirsiniz.
                </p>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : (
                <div className="space-y-2">
                    {sortedColumns.map((col, index) => (
                        <div
                            key={col.id}
                            draggable={canManage}
                            onDragStart={(e) => handleDragStart(e, col.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropReorder(e, col.id)}
                            className={`surface border rounded-lg p-3 ${canManage ? 'cursor-move' : ''} ${draggedId === col.id ? 'opacity-40' : ''
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {canManage && (
                                    <div className="flex flex-col shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleMove(index, -1)}
                                            disabled={index === 0}
                                            className="text-xs leading-none disabled:opacity-20 cursor-pointer"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMove(index, 1)}
                                            disabled={index === sortedColumns.length - 1}
                                            className="text-xs leading-none disabled:opacity-20 cursor-pointer"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                )}

                                {editingId === col.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="input-base border rounded px-2 py-1 text-sm flex-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer"
                                        >
                                            Kaydet
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            className="text-xs text-muted cursor-pointer"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="flex-1 font-medium text-primary">{col.name}</span>
                                        {canManage && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(col.id, col.name)}
                                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(col.id)}
                                                    className="text-xs text-red-500 dark:text-red-400 hover:underline cursor-pointer"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="mt-2 pl-4 space-y-1">
                                {col.statuses.length === 0 ? (
                                    <p className="text-xs text-muted">Bu column'a atanmış durum yok.</p>
                                ) : (
                                    col.statuses.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between text-xs">
                                            <span className="text-secondary">• {s.name}</span>
                                            {canManage && (
                                                <select
                                                    value={col.id}
                                                    onChange={(e) => handleAssignStatus(s.id, e.target.value)}
                                                    className="input-base border rounded px-1 py-0.5 text-xs cursor-pointer"
                                                >
                                                    {sortedColumns.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}

                    {unmappedStatuses.length > 0 && (
                        <div className="surface border border-orange-300 dark:border-orange-800 rounded-lg p-3">
                            <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
                                Henüz bir Column'a atanmamış durumlar (Board'da görünmezler):
                            </p>
                            {unmappedStatuses.map((s) => (
                                <div key={s.id} className="flex items-center justify-between text-xs py-1">
                                    <span className="text-secondary">{s.name}</span>
                                    {canManage && (
                                        <select
                                            defaultValue=""
                                            onChange={(e) => e.target.value && handleAssignStatus(s.id, e.target.value)}
                                            className="input-base border rounded px-1 py-0.5 text-xs cursor-pointer"
                                        >
                                            <option value="">Column seçin...</option>
                                            {sortedColumns.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {canManage && (
                <div className="surface border rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-secondary">Yeni Column Ekle</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Column adı (örn. Code Review)"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            className="flex-1 input-base border rounded px-3 py-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 cursor-pointer"
                        >
                            Ekle
                        </button>
                    </div>
                    <p className="text-xs text-muted">
                        Not: Yeni bir Status oluşturmak otomatik olarak yeni bir Column oluşturmaz. Status'u Workflow Editörü'nde
                        oluşturduktan sonra buradan uygun Column'a atayın.
                    </p>
                </div>
            )}
        </div>
    );
}