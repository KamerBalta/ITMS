import { useState, useMemo } from 'react';
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
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    MarkerType,
} from '@xyflow/react';
import type { Node, Edge, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { WorkflowStatus, WorkflowTransition } from '../../types/workflow';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const ALL_ROLES = ['Developer', 'QA/Tester', 'Project Manager', 'System Admin'];
const CATEGORY_LABELS: Record<string, string> = { ToDo: 'Yapılacak', InProgress: 'Devam Ediyor', Done: 'Tamamlandı' };
const CATEGORY_COLORS: Record<string, string> = {
    ToDo: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    InProgress: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    Done: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
};

type WorkflowNodeData = {
    status: WorkflowStatus;
    canManage: boolean;
    onEdit: (status: WorkflowStatus) => void;
    onDelete: (status: WorkflowStatus) => void;
    onSetInitial: (id: string) => void;
    onSetEpicCloseTarget: (id: string) => void;
};

function WorkflowStatusNode({ data }: NodeProps<Node<WorkflowNodeData>>) {
    const { status, canManage, onEdit, onDelete, onSetInitial, onSetEpicCloseTarget } = data;
    const categoryLabel = CATEGORY_LABELS[status.category] ?? status.category;

    return (
        <div
            className={[
                'min-w-[220px] overflow-hidden rounded-md border bg-white shadow-sm transition-shadow',
                'hover:shadow-md',
                status.isDraft ? 'opacity-70' : '',
                status.category === 'ToDo'
                    ? 'border-gray-300 dark:border-gray-700'
                    : status.category === 'InProgress'
                        ? 'border-blue-200 dark:border-blue-900'
                        : 'border-emerald-200 dark:border-emerald-900',
                'dark:bg-gray-900',
            ].join(' ')}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-2.5 !w-2.5 !border-2 !border-white !bg-gray-400 dark:!border-gray-900"
            />

            <div
                className={[
                    'h-1',
                    status.category === 'ToDo'
                        ? 'bg-gray-400'
                        : status.category === 'InProgress'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500',
                ].join(' ')}
            />

            <div className="px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {status.name}
                        </div>

                        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {categoryLabel}
                        </div>
                    </div>

                    {status.isDraft && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            TASLAK
                        </span>
                    )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    {status.isInitial && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            Başlangıç
                        </span>
                    )}

                    {status.isEpicCloseTarget && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            Epic Kapatma
                        </span>
                    )}
                </div>

                {canManage && (
                    <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-800">
                        {!status.isInitial && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetInitial(status.id);
                                }}
                                className="text-[10px] font-medium text-gray-500 hover:text-blue-600 hover:underline dark:text-gray-400 dark:hover:text-blue-400"
                            >
                                Başlangıç Yap
                            </button>
                        )}

                        {status.category === 'Done' && !status.isEpicCloseTarget && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetEpicCloseTarget(status.id);
                                }}
                                className="text-[10px] font-medium text-gray-500 hover:text-blue-600 hover:underline dark:text-gray-400 dark:hover:text-blue-400"
                            >
                                Epic Hedefi
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(status);
                            }}
                            className="ml-auto text-[10px] font-medium text-gray-500 hover:text-blue-600 hover:underline dark:text-gray-400 dark:hover:text-blue-400"
                        >
                            Düzenle
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(status);
                            }}
                            className="text-[10px] font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                            Sil
                        </button>
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!h-2.5 !w-2.5 !border-2 !border-white !bg-blue-500 dark:!border-gray-900"
            />
        </div>
    );
}

const workflowNodeTypes = {
    workflowStatus: WorkflowStatusNode,
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

    const sortedStatuses = useMemo(() => {
        return [...(statuses ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
    }, [statuses]);

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

    const groupedTransitions = useMemo(() => {
        return (transitions ?? []).reduce<Record<string, WorkflowTransition[]>>((acc, t) => {
            (acc[t.fromStatusId] ??= []).push(t);
            return acc;
        }, {});
    }, [transitions]);

    const workflowNodes = useMemo<Node<WorkflowNodeData>[]>(() => {
        return sortedStatuses.map((status, index) => {
            const row = index % 3;
            const column = Math.floor(index / 3);

            return {
                id: status.id,
                type: 'workflowStatus',
                position: {
                    x: column * 310,
                    y: row * 190,
                },
                data: {
                    status,
                    canManage,
                    onEdit: startEditingStatus,
                    onDelete: handleDeleteStatus,
                    onSetInitial: (id: string) => setInitialStatus.mutate(id),
                    onSetEpicCloseTarget: (id: string) => setEpicCloseTarget.mutate(id),
                },
                draggable: true,
            };
        });
    }, [sortedStatuses, canManage]);

    const workflowEdges = useMemo<Edge[]>(() => {
        return (transitions ?? []).map((transition) => ({
            id: transition.id,
            source: transition.fromStatusId,
            target: transition.toStatusId,
            type: 'smoothstep',
            animated: transition.isDraft,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
            },
            style: {
                stroke: transition.isDraft ? '#f59e0b' : '#6b7280',
                strokeWidth: 1.5,
            },
            label: transition.requireAssigneeSelf ? 'Atanan kişi' : undefined,
            labelStyle: {
                fontSize: 9,
                fontWeight: 500,
                fill: '#6b7280',
            },
            labelBgStyle: {
                fill: '#ffffff',
                fillOpacity: 0.95,
            },
            labelBgPadding: [4, 2] as [number, number],
            labelBgBorderRadius: 3,
        }));
    }, [transitions]);

    if (!projectId) return null;

    return (
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-hidden bg-[#f7f8fa] dark:bg-gray-950">
            {/* Header */}
            <div className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                        <Link
                            to={`/projects/${projectId}`}
                            className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            ← Proje Detayına Dön
                        </Link>

                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                                Workflow Editörü
                            </h1>

                            {hasUnpublished && (
                                <span className="rounded bg-amber-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    Taslak değişiklikler
                                </span>
                            )}
                        </div>

                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                            Durumları ve aralarındaki geçiş kurallarını yönetin.
                        </p>
                    </div>

                    {canManage && hasUnpublished && (
                        <button
                            onClick={handlePublish}
                            className="inline-flex shrink-0 items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
                        >
                            Yayınla
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
                <div className="space-y-4">
                    {!canManage && (
                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                            Bu sayfayı yalnızca görüntüleyebilirsiniz. Düzenleme yalnızca System Admin ve bu projenin sahibi olan Project Manager tarafından yapılabilir.
                        </p>
                    )}

                    {canManage && hasUnpublished && (
                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                            Yayınlanmamış değişiklikleriniz var. Taslak durum/geçişler gerçek görevleri henüz etkilemiyor — yukarıdaki "Yayınla" butonuna basana kadar aktif olmayacaklar.
                        </p>
                    )}

                    {error && (
                        <p className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    {/* Workflow Canvas */}
                    <section className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex min-h-[48px] items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/70">
                            <div>
                                <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                                    Workflow
                                </h2>
                                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                    Durumlar ve geçişler
                                </p>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                                <span>{sortedStatuses.length} durum</span>
                                <span>{(transitions ?? []).length} geçiş</span>
                            </div>
                        </div>

                        <div className="h-[560px] bg-[#fafbfc] dark:bg-gray-950">
                            {isLoading ? (
                                <div className="flex h-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                                    Workflow yükleniyor...
                                </div>
                            ) : sortedStatuses.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Henüz durum tanımlanmamış
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            İlk durumunuzu ekleyerek workflow oluşturmaya başlayın.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <ReactFlow
                                    key={`${sortedStatuses.map((s) => s.id).join('-')}-${(transitions ?? []).map((t) => t.id).join('-')}`}
                                    defaultNodes={workflowNodes}
                                    defaultEdges={workflowEdges}
                                    nodeTypes={workflowNodeTypes}
                                    fitView
                                    fitViewOptions={{
                                        padding: 0.25,
                                        minZoom: 0.65,
                                        maxZoom: 1.1,
                                    }}
                                    minZoom={0.4}
                                    maxZoom={1.5}
                                    nodesDraggable
                                    nodesConnectable={false}
                                    elementsSelectable
                                    panOnDrag
                                    zoomOnScroll
                                    proOptions={{ hideAttribution: true }}
                                >
                                    <Background
                                        gap={20}
                                        size={1}
                                        color="#e5e7eb"
                                    />

                                    <Controls
                                        showInteractive={false}
                                        className="!m-3 !overflow-hidden !rounded-md !border !border-gray-200 !bg-white !shadow-sm dark:!border-gray-700 dark:!bg-gray-900"
                                    />

                                    <MiniMap
                                        pannable
                                        zoomable
                                        nodeColor={(node) => {
                                            const status = (node.data as WorkflowNodeData)?.status;

                                            if (status?.category === 'Done') return '#10b981';
                                            if (status?.category === 'InProgress') return '#3b82f6';
                                            return '#9ca3af';
                                        }}
                                        className="!m-3 !rounded-md !border !border-gray-200 !bg-white dark:!border-gray-700 dark:!bg-gray-900"
                                    />
                                </ReactFlow>
                            )}
                        </div>
                    </section>

                    {/* Status Management */}
                    <section className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                            <div>
                                <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                                    Durum Yönetimi
                                </h2>
                                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                    Sıralama ve durum özelliklerini yönetin.
                                </p>
                            </div>

                            {canManage && (
                                <button
                                    onClick={() => setAddStatusOpen((v) => !v)}
                                    className="cursor-pointer text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    {isAddStatusOpen ? 'Vazgeç' : '+ Yeni Durum'}
                                </button>
                            )}
                        </div>

                        <div className="p-4">
                            {isLoading ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Yükleniyor...
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {sortedStatuses.map((s, index) => (
                                        <div
                                            key={s.id}
                                            className={`group flex min-h-[42px] items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${CATEGORY_COLORS[s.category]} ${s.isDraft ? 'opacity-70' : ''}`}
                                        >
                                            {canManage && (
                                                <div className="flex shrink-0 flex-col">
                                                    <button
                                                        onClick={() => handleMoveStatus(index, -1)}
                                                        disabled={index === 0}
                                                        className="cursor-pointer rounded px-1 text-[9px] leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                                    >
                                                        ▲
                                                    </button>

                                                    <button
                                                        onClick={() => handleMoveStatus(index, 1)}
                                                        disabled={index === sortedStatuses.length - 1}
                                                        className="cursor-pointer rounded px-1 text-[9px] leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                                    >
                                                        ▼
                                                    </button>
                                                </div>
                                            )}

                                            {editingStatusId === s.id ? (
                                                <div className="flex flex-1 items-center gap-2">
                                                    <input
                                                        value={editStatusName}
                                                        onChange={(e) => setEditStatusName(e.target.value)}
                                                        className="input-base flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                                    />

                                                    <select
                                                        value={editStatusCategory}
                                                        onChange={(e) => setEditStatusCategory(e.target.value)}
                                                        className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                                    >
                                                        <option value="ToDo">Yapılacak</option>
                                                        <option value="InProgress">Devam Ediyor</option>
                                                        <option value="Done">Tamamlandı</option>
                                                    </select>

                                                    <button
                                                        onClick={handleSaveStatus}
                                                        className="cursor-pointer text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        Kaydet
                                                    </button>

                                                    <button
                                                        onClick={() => setEditingStatusId(null)}
                                                        className="cursor-pointer text-[11px] font-medium text-gray-500 hover:underline dark:text-gray-400"
                                                    >
                                                        İptal
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[13px] font-medium text-gray-800 dark:text-gray-100">
                                                                {s.name}
                                                            </span>

                                                            {s.isInitial && (
                                                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                                                    Başlangıç
                                                                </span>
                                                            )}

                                                            {s.isEpicCloseTarget && (
                                                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                                    Epic Kapatma
                                                                </span>
                                                            )}

                                                            {s.isDraft && (
                                                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                                    Taslak
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <span className="shrink-0 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                                        {CATEGORY_LABELS[s.category]}
                                                    </span>

                                                    {canManage && (
                                                        <div className="flex shrink-0 items-center gap-2">
                                                            {!s.isInitial && (
                                                                <button
                                                                    onClick={() => setInitialStatus.mutate(s.id)}
                                                                    className="cursor-pointer text-[10px] font-medium text-gray-500 hover:text-blue-600 hover:underline dark:text-gray-400 dark:hover:text-blue-400"
                                                                >
                                                                    Başlangıç Yap
                                                                </button>
                                                            )}

                                                            {s.category === 'Done' && !s.isEpicCloseTarget && (
                                                                <button
                                                                    onClick={() => setEpicCloseTarget.mutate(s.id)}
                                                                    className="cursor-pointer text-[10px] font-medium text-gray-500 hover:text-blue-600 hover:underline dark:text-gray-400 dark:hover:text-blue-400"
                                                                >
                                                                    Epic Hedefi
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => startEditingStatus(s)}
                                                                className="cursor-pointer text-[10px] font-medium text-gray-500 hover:text-blue-600 hover:underline dark:text-gray-400 dark:hover:text-blue-400"
                                                            >
                                                                Düzenle
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteStatus(s)}
                                                                className="cursor-pointer text-[10px] font-medium text-red-600 hover:underline dark:text-red-400"
                                                            >
                                                                Sil
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Yeni Status */}
                            {isAddStatusOpen && canManage && (
                                <div className="mt-3 space-y-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                                    <input
                                        type="text"
                                        placeholder="Durum adı (örn. Code Review)"
                                        value={newStatusName}
                                        onChange={(e) => setNewStatusName(e.target.value)}
                                        className="input-base w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                    />

                                    <select
                                        value={newStatusCategory}
                                        onChange={(e) => setNewStatusCategory(e.target.value)}
                                        className="input-base w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                    >
                                        <option value="ToDo">Yapılacak</option>
                                        <option value="InProgress">Devam Ediyor</option>
                                        <option value="Done">Tamamlandı</option>
                                    </select>

                                    <button
                                        onClick={handleCreateStatus}
                                        className="w-full cursor-pointer rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Ekle (taslak olarak)
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Transitions */}
                    <section className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                            <div>
                                <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                                    Geçişler
                                </h2>
                                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                    Workflow üzerindeki geçiş kuralları.
                                </p>
                            </div>

                            {canManage && (
                                <button
                                    onClick={() => setAddTransitionOpen((v) => !v)}
                                    className="cursor-pointer text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    {isAddTransitionOpen ? 'Vazgeç' : '+ Yeni Geçiş'}
                                </button>
                            )}
                        </div>

                        <div className="p-4">
                            <div className="space-y-3">
                                {sortedStatuses.map((status) => {
                                    const outgoing = groupedTransitions[status.id] ?? [];

                                    if (outgoing.length === 0) return null;

                                    return (
                                        <div key={status.id}>
                                            <span
                                                className={`mb-1.5 inline-block rounded px-2 py-1 text-[10px] font-semibold ${CATEGORY_COLORS[status.category]}`}
                                            >
                                                {status.name}
                                            </span>

                                            <div className="space-y-1 border-l border-gray-200 pl-3 dark:border-gray-800">
                                                {outgoing.map((t) => (
                                                    <div
                                                        key={t.id}
                                                        className="group flex min-h-[30px] items-center gap-2 text-xs"
                                                    >
                                                        <span className="text-gray-400 dark:text-gray-500">
                                                            →
                                                        </span>

                                                        <span className="font-medium text-gray-700 dark:text-gray-200">
                                                            {t.toStatusName}
                                                        </span>

                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                            {t.allowedRoles.join(', ')}
                                                        </span>

                                                        {t.requireAssigneeSelf && (
                                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                                yalnızca atanan
                                                            </span>
                                                        )}

                                                        {t.isDraft && (
                                                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                                Taslak
                                                            </span>
                                                        )}

                                                        {canManage && (
                                                            <button
                                                                onClick={() => deleteTransition.mutate(t.id)}
                                                                className="ml-auto cursor-pointer text-[10px] font-medium text-red-600 hover:underline dark:text-red-400"
                                                            >
                                                                Sil
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {(transitions ?? []).length === 0 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Henüz hiçbir geçiş tanımlanmamış.
                                    </p>
                                )}
                            </div>

                            {/* Yeni Transition */}
                            {isAddTransitionOpen && canManage && (
                                <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <select
                                            value={newFromId}
                                            onChange={(e) => setNewFromId(e.target.value)}
                                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                        >
                                            <option value="">Başlangıç durumu</option>
                                            {sortedStatuses.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={newToId}
                                            onChange={(e) => setNewToId(e.target.value)}
                                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                        >
                                            <option value="">Hedef durum</option>
                                            {sortedStatuses.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            İzin verilen roller
                                        </p>

                                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                            {ALL_ROLES.map((role) => (
                                                <label
                                                    key={role}
                                                    className="flex cursor-pointer items-center gap-2 py-0.5 text-xs text-gray-600 dark:text-gray-300"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={newRoles.includes(role)}
                                                        onChange={() => toggleRole(role)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                                    />
                                                    {role}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={newRequireSelf}
                                            onChange={(e) => setNewRequireSelf(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                        />
                                        Yalnızca görevin atandığı kişi yapabilsin
                                    </label>

                                    <button
                                        onClick={handleCreateTransition}
                                        className="w-full cursor-pointer rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Ekle (taslak olarak)
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}