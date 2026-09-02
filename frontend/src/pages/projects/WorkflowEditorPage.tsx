import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCanManageProject } from '../../hooks/useCanManageProject';
import {
    useWorkflowStatuses,
    useWorkflowTransitions,
    useHasUnpublishedChanges,
    useCreateStatus,
    useUpdateStatus,
    useDeleteStatus,
    useReorderStatuses,
    useSetInitialStatus,
    useSetEpicCloseTarget,
    useCreateTransition,
    useDeleteTransition,
    usePublishWorkflow,
} from '../../hooks/useWorkflow';
import type { WorkflowStatus, WorkflowTransition } from '../../types/workflow';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const ALL_ROLES = ['Developer', 'QA/Tester', 'Project Manager', 'System Admin'];
const CATEGORY_LABELS: Record<string, string> = { ToDo: 'Yapılacak', InProgress: 'Devam Ediyor', Done: 'Tamamlandı' };
const CATEGORY_COLORS: Record<string, string> = {
    ToDo: 'bg-gray-100 dark:bg-gray-700 text-secondary border-gray-300 dark:border-gray-600',
    InProgress: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    Done: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
};

export function WorkflowEditorPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const canManage = useCanManageProject(projectId ?? null);
    const { data: statuses, isLoading } = useWorkflowStatuses(projectId ?? null, true);
    const { data: transitions } = useWorkflowTransitions(projectId ?? null, true);
    const { data: hasUnpublished } = useHasUnpublishedChanges(projectId ?? null);

    const createStatus = useCreateStatus(projectId!);
    const updateStatus = useUpdateStatus(projectId!);
    const deleteStatus = useDeleteStatus(projectId!);
    const reorderStatuses = useReorderStatuses(projectId!);
    const setInitialStatus = useSetInitialStatus(projectId!);
    const setEpicCloseTarget = useSetEpicCloseTarget(projectId!);
    const createTransition = useCreateTransition(projectId!);
    const deleteTransition = useDeleteTransition(projectId!);
    const publishWorkflow = usePublishWorkflow(projectId!);

    const [error, setError] = useState<string | null>(null);
    const [isAddStatusOpen, setAddStatusOpen] = useState(false);
    const [newStatusName, setNewStatusName] = useState('');
    const [newStatusCategory, setNewStatusCategory] = useState('ToDo');
    const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
    const [editStatusName, setEditStatusName] = useState('');
    const [editStatusCategory, setEditStatusCategory] = useState('ToDo');

    const [isAddTransitionOpen, setAddTransitionOpen] = useState(false);
    const [newFromId, setNewFromId] = useState('');
    const [newToId, setNewToId] = useState('');
    const [newRoles, setNewRoles] = useState<string[]>([]);
    const [newRequireSelf, setNewRequireSelf] = useState(false);

    if (!projectId) return null;

    const sortedStatuses = [...(statuses ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

    const handleMoveStatus = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= sortedStatuses.length) return;
        const newOrder = [...sortedStatuses];
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
        reorderStatuses.mutate(newOrder.map((s) => s.id));
    };

    const handleCreateStatus = async () => {
        if (!newStatusName.trim()) return;
        setError(null);
        try {
            await createStatus.mutateAsync({ name: newStatusName, category: newStatusCategory });
            setNewStatusName('');
            setAddStatusOpen(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Oluşturulamadı.');
        }
    };

    const startEditingStatus = (s: WorkflowStatus) => {
        setEditingStatusId(s.id);
        setEditStatusName(s.name);
        setEditStatusCategory(s.category);
    };

    const handleSaveStatus = async () => {
        if (!editingStatusId) return;
        setError(null);
        try {
            await updateStatus.mutateAsync({ id: editingStatusId, data: { name: editStatusName, category: editStatusCategory } });
            setEditingStatusId(null);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Güncellenemedi.');
        }
    };

    const handleDeleteStatus = async (s: WorkflowStatus) => {
        setError(null);
        if (!confirm(`"${s.name}" durumunu silmek istediğinize emin misiniz?`)) return;
        try {
            await deleteStatus.mutateAsync(s.id);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Silinemedi.');
        }
    };

    const toggleRole = (role: string) => {
        setNewRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
    };

    const handleCreateTransition = async () => {
        if (!newFromId || !newToId || newRoles.length === 0) {
            setError('Başlangıç durumu, hedef durum ve en az bir rol seçmelisiniz.');
            return;
        }
        setError(null);
        try {
            await createTransition.mutateAsync({ fromStatusId: newFromId, toStatusId: newToId, allowedRoles: newRoles, requireAssigneeSelf: newRequireSelf });
            setNewFromId('');
            setNewToId('');
            setNewRoles([]);
            setNewRequireSelf(false);
            setAddTransitionOpen(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Oluşturulamadı.');
        }
    };

    const handlePublish = async () => {
        if (!confirm('Tüm taslak değişiklikler yayınlanacak ve gerçek görevleri etkilemeye başlayacak. Devam edilsin mi?')) return;
        setError(null);
        try {
            await publishWorkflow.mutateAsync();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Yayınlanamadı.');
        }
    };

    const groupedTransitions = (transitions ?? []).reduce<Record<string, WorkflowTransition[]>>((acc, t) => {
        (acc[t.fromStatusId] ??= []).push(t);
        return acc;
    }, {});

    return (
        <div className="max-w-3xl space-y-4">
            <Link to={`/projects/${projectId}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                ← Proje Detayına Dön
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Workflow Editörü</h1>
                    <p className="text-sm text-muted">Durumları ve aralarındaki geçiş kurallarını yönetin.</p>
                </div>
                {canManage && hasUnpublished && (
                    <button onClick={handlePublish} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 whitespace-nowrap">
                        🚀 Yayınla
                    </button>
                )}
            </div>

            {!canManage && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded px-3 py-2">
                    Bu sayfayı yalnızca görüntüleyebilirsiniz. Düzenleme yalnızca System Admin ve bu projenin sahibi olan Project Manager tarafından yapılabilir.
                </p>
            )}

            {canManage && hasUnpublished && (
                <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded px-3 py-2">
                    ⚠ Yayınlanmamış değişiklikleriniz var. Taslak durum/geçişler gerçek görevleri henüz etkilemiyor — yukarıdaki
                    "Yayınla" butonuna basana kadar aktif olmayacaklar.
                </p>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Durumlar */}
            <div className="surface border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-primary">Durumlar</h2>
                    {canManage && (
                        <button onClick={() => setAddStatusOpen((v) => !v)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                            {isAddStatusOpen ? 'Vazgeç' : '+ Yeni Durum'}
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <p className="text-muted text-sm">Yükleniyor...</p>
                ) : (
                    <div className="space-y-2">
                        {sortedStatuses.map((s, index) => (
                            <div key={s.id} className={`flex items-center gap-2 p-2 rounded border ${CATEGORY_COLORS[s.category]} ${s.isDraft ? 'opacity-70' : ''}`}>
                                {canManage && (
                                    <div className="flex flex-col shrink-0">
                                        <button onClick={() => handleMoveStatus(index, -1)} disabled={index === 0} className="text-xs leading-none disabled:opacity-20">▲</button>
                                        <button onClick={() => handleMoveStatus(index, 1)} disabled={index === sortedStatuses.length - 1} className="text-xs leading-none disabled:opacity-20">▼</button>
                                    </div>
                                )}

                                {editingStatusId === s.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input value={editStatusName} onChange={(e) => setEditStatusName(e.target.value)} className="input-base border rounded px-2 py-1 text-sm flex-1" />
                                        <select value={editStatusCategory} onChange={(e) => setEditStatusCategory(e.target.value)} className="input-base border rounded px-2 py-1 text-sm">
                                            <option value="ToDo">Yapılacak</option>
                                            <option value="InProgress">Devam Ediyor</option>
                                            <option value="Done">Tamamlandı</option>
                                        </select>
                                        <button onClick={handleSaveStatus} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Kaydet</button>
                                        <button onClick={() => setEditingStatusId(null)} className="text-xs text-muted">İptal</button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="flex-1 text-sm font-medium">
                                            {s.name}
                                            {s.isInitial && <span className="text-[10px] ml-1 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-full">Başlangıç</span>}
                                            {s.isEpicCloseTarget && <span className="text-[10px] ml-1 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-full">Epic Kapatma</span>}
                                            {s.isDraft && <span className="text-[10px] ml-1 bg-orange-200 dark:bg-orange-900 px-1.5 py-0.5 rounded-full">Taslak</span>}
                                        </span>
                                        <span className="text-xs opacity-70">{CATEGORY_LABELS[s.category]}</span>
                                        {canManage && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                {!s.isInitial && (
                                                    <button onClick={() => setInitialStatus.mutate(s.id)} className="text-xs hover:underline">Başlangıç Yap</button>
                                                )}
                                                {s.category === 'Done' && !s.isEpicCloseTarget && (
                                                    <button onClick={() => setEpicCloseTarget.mutate(s.id)} className="text-xs hover:underline">Epic Hedefi Yap</button>
                                                )}
                                                <button onClick={() => startEditingStatus(s)} className="text-xs hover:underline">Düzenle</button>
                                                <button onClick={() => handleDeleteStatus(s)} className="text-xs text-red-600 dark:text-red-400 hover:underline">Sil</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {isAddStatusOpen && canManage && (
                    <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                        <input type="text" placeholder="Durum adı (örn. Code Review)" value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm" />
                        <select value={newStatusCategory} onChange={(e) => setNewStatusCategory(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm">
                            <option value="ToDo">Yapılacak</option>
                            <option value="InProgress">Devam Ediyor</option>
                            <option value="Done">Tamamlandı</option>
                        </select>
                        <button onClick={handleCreateStatus} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">
                            Ekle (taslak olarak)
                        </button>
                    </div>
                )}
            </div>

            {/* Gecisler */}
            <div className="surface border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-primary">Geçişler</h2>
                    {canManage && (
                        <button onClick={() => setAddTransitionOpen((v) => !v)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                            {isAddTransitionOpen ? 'Vazgeç' : '+ Yeni Geçiş'}
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {sortedStatuses.map((status) => {
                        const outgoing = groupedTransitions[status.id] ?? [];
                        if (outgoing.length === 0) return null;

                        return (
                            <div key={status.id}>
                                <span className={`inline-block text-xs px-2 py-1 rounded-full border font-medium mb-2 ${CATEGORY_COLORS[status.category]}`}>
                                    {status.name}
                                </span>
                                <div className="space-y-1 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                                    {outgoing.map((t) => (
                                        <div key={t.id} className="flex items-center gap-2 text-sm">
                                            <span className="text-muted">→</span>
                                            <span className="font-medium text-secondary">{t.toStatusName}</span>
                                            <span className="text-xs text-muted">{t.allowedRoles.join(', ')}</span>
                                            {t.requireAssigneeSelf && <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-muted px-1.5 rounded">yalnızca atanan</span>}
                                            {t.isDraft && <span className="text-[10px] bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 px-1.5 rounded">Taslak</span>}
                                            {canManage && (
                                                <button onClick={() => deleteTransition.mutate(t.id)} className="text-xs text-red-500 dark:text-red-400 hover:underline ml-auto">Sil</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {(transitions ?? []).length === 0 && <p className="text-sm text-muted">Henüz hiçbir geçiş tanımlanmamış.</p>}
                </div>

                {isAddTransitionOpen && canManage && (
                    <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <select value={newFromId} onChange={(e) => setNewFromId(e.target.value)} className="input-base border rounded px-2 py-2 text-sm">
                                <option value="">Başlangıç durumu</option>
                                {sortedStatuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={newToId} onChange={(e) => setNewToId(e.target.value)} className="input-base border rounded px-2 py-2 text-sm">
                                <option value="">Hedef durum</option>
                                {sortedStatuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-xs text-muted mb-1">İzin verilen roller</p>
                            {ALL_ROLES.map((role) => (
                                <label key={role} className="flex items-center gap-2 text-sm py-0.5 text-secondary">
                                    <input type="checkbox" checked={newRoles.includes(role)} onChange={() => toggleRole(role)} />
                                    {role}
                                </label>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-secondary">
                            <input type="checkbox" checked={newRequireSelf} onChange={(e) => setNewRequireSelf(e.target.checked)} />
                            Yalnızca görevin atandığı kişi yapabilsin
                        </label>
                        <button onClick={handleCreateTransition} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">
                            Ekle (taslak olarak)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}