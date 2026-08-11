import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    MarkerType,
    useEdgesState,
    useNodesState,
    type Connection,
    type Edge,
    type Node,
    type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAuthStore } from '../../store/authStore';
import { useProjectDetail } from '../../hooks/useProjects';
import {
    useWorkflowTransitions,
    useCreateTransition,
    useUpdateTransition,
    useDeleteTransition,
} from '../../hooks/useWorkflow';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ConfirmDialog';

import type { WorkflowTransition } from '../../types/workflow';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const ALL_STATUSES = [
    'ToDo',
    'InProgress',
    'ReadyForReview',
    'ReadyForQA',
    'Done',
    'Closed',
];

const ALL_ROLES = [
    'Developer',
    'QA/Tester',
    'Project Manager',
    'System Admin',
];

const STATUS_LABELS: Record<string, string> = {
    ToDo: 'TO DO',
    InProgress: 'IN PROGRESS',
    ReadyForReview: 'IN REVIEW',
    ReadyForQA: 'IN QA',
    Done: 'DONE',
    Closed: 'CLOSED',
};

const STATUS_COLORS: Record<
    string,
    {
        bg: string;
        border: string;
        text: string;
        dot: string;
    }
> = {
    ToDo: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        border: 'border-slate-300 dark:border-slate-600',
        text: 'text-slate-700 dark:text-slate-200',
        dot: '#64748b',
    },
    InProgress: {
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-300',
        dot: '#3b82f6',
    },
    ReadyForReview: {
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        border: 'border-amber-300 dark:border-amber-700',
        text: 'text-amber-800 dark:text-amber-300',
        dot: '#f59e0b',
    },
    ReadyForQA: {
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        border: 'border-purple-300 dark:border-purple-700',
        text: 'text-purple-700 dark:text-purple-300',
        dot: '#a855f7',
    },
    Done: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        border: 'border-emerald-300 dark:border-emerald-700',
        text: 'text-emerald-700 dark:text-emerald-300',
        dot: '#10b981',
    },
    Closed: {
        bg: 'bg-gray-100 dark:bg-gray-800',
        border: 'border-gray-300 dark:border-gray-600',
        text: 'text-gray-700 dark:text-gray-200',
        dot: '#6b7280',
    },
};

type WorkflowNodeData = {
    status: string;
    transitionCount: number;
};

type WorkflowNode = Node<WorkflowNodeData, 'workflowStatus'>;

function WorkflowStatusNode({ data }: NodeProps<WorkflowNode>) {
    const colors = STATUS_COLORS[data.status] ?? STATUS_COLORS.ToDo;

    return (
        <div
            className={`
                relative w-[210px]
                overflow-hidden
                rounded-lg
                border
                bg-white
                shadow-sm
                transition
                hover:shadow-md
                dark:bg-gray-900
                ${colors.border}
            `}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-3 !w-3 !border-2 !border-white dark:!border-gray-900"
                style={{ background: colors.dot }}
            />

            <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: colors.dot }}
                    />

                    <span className="text-sm font-semibold text-primary">
                        {STATUS_LABELS[data.status] ?? data.status}
                    </span>
                </div>
            </div>

            <div className="border-t border-border px-4 py-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">
                        {data.transitionCount} geçiş
                    </span>

                    <span className="text-[10px] font-medium uppercase text-muted">
                        Status
                    </span>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!h-3 !w-3 !border-2 !border-white dark:!border-gray-900"
                style={{ background: colors.dot }}
            />
        </div>
    );
}

const nodeTypes = {
    workflowStatus: WorkflowStatusNode,
};

export function WorkflowEditorPage() {
    const { projectId } = useParams<{ projectId: string }>();

    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.roles.includes('System Admin') ?? false;

    // Proje detayını çekiyoruz
    const { data: project } = useProjectDetail(projectId ?? null);

    const canManage =
        isAdmin ||
        (user?.roles.includes('Project Manager') &&
            project?.ownerName === user?.email);

    const { data: transitions, isLoading } = useWorkflowTransitions(
        projectId ?? null
    );

    const createTransition = useCreateTransition(projectId!);
    const updateTransition = useUpdateTransition(projectId!);
    const deleteTransition = useDeleteTransition(projectId!);

    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
    const [selectedTransition, setSelectedTransition] =
        useState<WorkflowTransition | null>(null);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newFrom, setNewFrom] = useState('ToDo');
    const [newTo, setNewTo] = useState('InProgress');
    const [newRoles, setNewRoles] = useState<string[]>([]);
    const [newRequireSelf, setNewRequireSelf] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initialNodes = useMemo<WorkflowNode[]>(() => {
        const positions: Record<string, { x: number; y: number }> = {
            ToDo: { x: 50, y: 100 },
            InProgress: { x: 350, y: 100 },
            ReadyForReview: { x: 650, y: 100 },
            ReadyForQA: { x: 950, y: 100 },
            Done: { x: 1250, y: 50 },
            Closed: { x: 1250, y: 220 },
        };

        return ALL_STATUSES.map((status) => ({
            id: status,
            type: 'workflowStatus',
            position: positions[status],
            data: {
                status,
                transitionCount:
                    transitions?.filter((t) => t.fromStatus === status)
                        .length ?? 0,
            },
        }));
    }, [transitions]);

    const initialEdges = useMemo<Edge[]>(() => {
        return (transitions ?? []).map((transition) => {
            const isSelected = selectedTransition?.id === transition.id;
            return {
                id: transition.id,
                source: transition.fromStatus,
                target: transition.toStatus,
                type: 'smoothstep',
                label: '',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 18,
                    height: 18,
                    color: isSelected ? '#4f46e5' : '#64748b',
                },
                style: {
                    strokeWidth: isSelected ? 3 : 2,
                    stroke: isSelected ? '#4f46e5' : '#64748b',
                },
                data: {
                    transitionId: transition.id,
                    allowedRoles: transition.allowedRoles,
                    requireAssigneeSelf: transition.requireAssigneeSelf,
                },
            };
        });
    }, [transitions, selectedTransition]);

    const [nodes, setNodes, onNodesChange] =
        useNodesState<WorkflowNode>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    useEffect(() => {
        setEdges(initialEdges);
    }, [initialEdges, setEdges]);

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!canManage) return;

            if (!connection.source || !connection.target) return;

            if (connection.source === connection.target) {
                setError('Bir durum kendisine geçiş yapamaz.');
                return;
            }

            const exists = transitions?.some(
                (t) =>
                    t.fromStatus === connection.source &&
                    t.toStatus === connection.target
            );

            if (exists) {
                setError('Bu geçiş zaten tanımlanmış.');
                return;
            }

            setError(null);
            setNewFrom(connection.source);
            setNewTo(connection.target);
            setNewRoles([]);
            setNewRequireSelf(false);
            setIsAddOpen(true);
        },
        [canManage, transitions]
    );

    const handleEdgeClick = (_event: React.MouseEvent, edge: Edge) => {
        const transitionId = edge.data?.transitionId;
        if (!transitionId) return;

        const transition = transitions?.find((t) => t.id === transitionId);
        if (transition) {
            setSelectedTransition(transition);
        }
    };

    const handleDelete = async (transition: WorkflowTransition) => {
        const fromName = STATUS_LABELS[transition.fromStatus] ?? transition.fromStatus;
        const toName = STATUS_LABELS[transition.toStatus] ?? transition.toStatus;

        const ok = await confirm(
            'Geçişi Sil',
            `"${fromName} → ${toName}" geçişini silmek istediğinize emin misiniz?`,
            true
        );
        if (!ok) return;

        try {
            await deleteTransition.mutateAsync(transition.id);
            setSelectedTransition(null);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(
                axiosError.response?.data?.message ?? 'Geçiş silinemedi.'
            );
        }
    };

    const handleCreate = async () => {
        if (newFrom === newTo) {
            setError('Başlangıç ve hedef durumu aynı olamaz.');
            return;
        }

        if (newRoles.length === 0) {
            setError('En az bir rol seçmelisiniz.');
            return;
        }

        setError(null);

        try {
            await createTransition.mutateAsync({
                fromStatus: newFrom,
                toStatus: newTo,
                allowedRoles: newRoles,
                requireAssigneeSelf: newRequireSelf,
            });

            setIsAddOpen(false);
            setNewRoles([]);
            setNewRequireSelf(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(
                axiosError.response?.data?.message ??
                'Geçiş oluşturulamadı.'
            );
        }
    };

    const groupedByFrom = useMemo(() => {
        return (transitions ?? []).reduce<Record<string, WorkflowTransition[]>>(
            (acc, t) => {
                (acc[t.fromStatus] ??= []).push(t);
                return acc;
            },
            {}
        );
    }, [transitions]);

    if (!projectId) return null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <p className="text-sm text-secondary">Workflow yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col p-6">
            {/* Header */}
            <div className="shrink-0 border-b border-border pb-4 mb-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Link
                            to={`/projects/${projectId}`}
                            className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary"
                        >
                            ← {project?.name ?? 'Proje'} / Proje Ayarları
                        </Link>

                        <div className="mt-3">
                            <h1 className="text-xl font-semibold text-primary">
                                Workflow
                            </h1>

                            <p className="mt-1 text-sm text-secondary">
                                Durumlar arasındaki geçişleri ve geçiş yetkilerini yönetin.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-border bg-surface-muted p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('canvas')}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${viewMode === 'canvas'
                                        ? 'bg-white text-primary shadow-sm dark:bg-gray-800'
                                        : 'text-secondary hover:text-primary'
                                    }`}
                            >
                                Canvas
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${viewMode === 'list'
                                        ? 'bg-white text-primary shadow-sm dark:bg-gray-800'
                                        : 'text-secondary hover:text-primary'
                                    }`}
                            >
                                Liste
                            </button>
                        </div>

                        {canManage && (
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setIsAddOpen(true);
                                }}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                            >
                                + Geçiş ekle
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-3 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="font-bold text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* View Mode 1: Canvas (React Flow) */}
            {viewMode === 'canvas' ? (
                <div className="relative flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-surface">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onEdgeClick={handleEdgeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.25 }}
                        nodesConnectable={canManage}
                        nodesDraggable={canManage}
                        elementsSelectable
                        attributionPosition="bottom-left"
                    >
                        <Background
                            gap={24}
                            size={1}
                        />
                        <Controls />
                        <MiniMap
                            pannable
                            zoomable
                            nodeColor={(node) => {
                                const status = (node.data as WorkflowNodeData)
                                    ?.status;
                                return STATUS_COLORS[status]?.dot ?? '#94a3b8';
                            }}
                        />
                    </ReactFlow>
                </div>
            ) : (
                /* View Mode 2: Liste Görünümü (Fallback) */
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {ALL_STATUSES.map((status) => {
                        const outgoing = groupedByFrom[status] ?? [];
                        if (outgoing.length === 0) return null;

                        const colors = STATUS_COLORS[status] ?? STATUS_COLORS.ToDo;

                        return (
                            <div
                                key={status}
                                className="surface border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm"
                            >
                                <span
                                    className={`inline-block text-xs px-2.5 py-1 rounded-full border font-bold mb-3 ${colors.bg} ${colors.border} ${colors.text}`}
                                >
                                    {STATUS_LABELS[status] ?? status}
                                </span>

                                <div className="space-y-2 pl-3 border-l-2 border-gray-100 dark:border-gray-800">
                                    {outgoing.map((t) => {
                                        const targetColors = STATUS_COLORS[t.toStatus] ?? STATUS_COLORS.ToDo;
                                        return (
                                            <div
                                                key={t.id}
                                                className="flex items-center justify-between text-sm p-2 rounded-lg surface-muted hover-surface transition"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted">→</span>
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${targetColors.bg} ${targetColors.border} ${targetColors.text}`}
                                                    >
                                                        {STATUS_LABELS[t.toStatus] ?? t.toStatus}
                                                    </span>
                                                    <span className="text-xs text-secondary ml-2">
                                                        [{t.allowedRoles.join(', ')}]
                                                    </span>
                                                    {t.requireAssigneeSelf && (
                                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded font-medium">
                                                            Yalnızca Atanan
                                                        </span>
                                                    )}
                                                </div>

                                                {canManage && (
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => setSelectedTransition(t)}
                                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                                                        >
                                                            Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t)}
                                                            className="text-xs text-red-500 dark:text-red-400 hover:underline font-medium cursor-pointer"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {(transitions ?? []).length === 0 && (
                        <div className="text-center py-12 surface border border-gray-200 dark:border-gray-700 rounded-xl">
                            <p className="text-sm text-muted">
                                Bu proje için henüz geçiş tanımlanmamış.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Selected Transition Panel (Drawer) */}
            {selectedTransition && (
                <TransitionPanel
                    transition={selectedTransition}
                    canManage={canManage}
                    onClose={() => setSelectedTransition(null)}
                    onUpdate={async (roles, requireSelf) => {
                        try {
                            await updateTransition.mutateAsync({
                                id: selectedTransition.id,
                                data: {
                                    allowedRoles: roles,
                                    requireAssigneeSelf: requireSelf,
                                },
                            });
                            setSelectedTransition(null);
                        } catch (err) {
                            const axiosError = err as AxiosError<ApiErrorResponse>;
                            setError(
                                axiosError.response?.data?.message ??
                                'Geçiş güncellenemedi.'
                            );
                        }
                    }}
                    onDelete={() => handleDelete(selectedTransition)}
                />
            )}

            {/* Add Transition Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
                    <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6 bg-white dark:bg-gray-900">
                        <h2 className="text-lg font-semibold text-primary">
                            Yeni Workflow Geçişi
                        </h2>

                        <p className="text-xs text-muted mt-1 mb-5">
                            Hangi durumdan hangi duruma geçilebileceğini tanımlayın.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-secondary mb-1">
                                    Başlangıç
                                </label>
                                <select
                                    value={newFrom}
                                    onChange={(e) => setNewFrom(e.target.value)}
                                    className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm cursor-pointer"
                                >
                                    {ALL_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {STATUS_LABELS[status] ?? status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-secondary mb-1">
                                    Hedef
                                </label>
                                <select
                                    value={newTo}
                                    onChange={(e) => setNewTo(e.target.value)}
                                    className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm cursor-pointer"
                                >
                                    {ALL_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {STATUS_LABELS[status] ?? status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-5">
                            <p className="text-xs font-medium text-secondary mb-2">
                                İzin verilen roller
                            </p>
                            <div className="space-y-2">
                                {ALL_ROLES.map((role) => {
                                    const checked = newRoles.includes(role);
                                    return (
                                        <label
                                            key={role}
                                            className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition ${checked
                                                    ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40'
                                                    : 'border-border hover:bg-surface-muted'
                                                }`}
                                        >
                                            <span className="text-sm text-primary">{role}</span>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    setNewRoles((prev) =>
                                                        prev.includes(role)
                                                            ? prev.filter((r) => r !== role)
                                                            : [...prev, role]
                                                    )
                                                }
                                                className="h-4 w-4 rounded"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-5 rounded-lg border border-border p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newRequireSelf}
                                    onChange={(e) => setNewRequireSelf(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded"
                                />
                                <div>
                                    <p className="text-sm font-medium text-primary">
                                        Yalnızca atanan kişi
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-secondary">
                                        Bu geçiş yalnızca görevin atanmış kullanıcısı tarafından gerçekleştirilebilir.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg text-sm hover-surface text-secondary transition cursor-pointer"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={createTransition.isPending}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                            >
                                {createTransition.isPending
                                    ? 'Oluşturuluyor...'
                                    : 'Geçiş oluştur'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                danger={confirmState.danger}
                confirmLabel="Sil"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}

function TransitionPanel({
    transition,
    canManage,
    onClose,
    onUpdate,
    onDelete,
}: {
    transition: WorkflowTransition;
    canManage: boolean;
    onClose: () => void;
    onUpdate: (roles: string[], requireSelf: boolean) => Promise<void>;
    onDelete: () => void;
}) {
    const [roles, setRoles] = useState<string[]>(transition.allowedRoles);
    const [requireSelf, setRequireSelf] = useState<boolean>(
        transition.requireAssigneeSelf
    );

    return (
        <div className="fixed inset-y-0 right-0 z-[100] flex h-full w-[380px] flex-col border-l border-border bg-white dark:bg-gray-900 shadow-2xl isolate animate-in fade-in slide-in-from-right-2 duration-150">
            <div className="flex items-start justify-between border-b border-border px-5 py-4 bg-white dark:bg-gray-900">
                <div>
                    <p className="text-sm font-semibold text-primary">
                        Geçiş ayrıntıları
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                        <span className="rounded bg-surface-muted px-2 py-1 text-xs font-medium text-secondary">
                            {STATUS_LABELS[transition.fromStatus] ?? transition.fromStatus}
                        </span>

                        <span className="text-muted">→</span>

                        <span className="rounded bg-surface-muted px-2 py-1 text-xs font-medium text-secondary">
                            {STATUS_LABELS[transition.toStatus] ?? transition.toStatus}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="rounded p-1.5 text-secondary hover:bg-surface-muted hover:text-primary cursor-pointer"
                >
                    ✕
                </button>
            </div>

            <div className="p-5 space-y-5 flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                <div>
                    <p className="mb-2 text-xs font-semibold text-primary">
                        İzin verilen roller
                    </p>
                    <div className="space-y-2">
                        {ALL_ROLES.map((role) => {
                            const checked = roles.includes(role);
                            return (
                                <label
                                    key={role}
                                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition ${checked
                                            ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40'
                                            : 'border-border hover:bg-surface-muted'
                                        }`}
                                >
                                    <span className="text-sm text-primary">{role}</span>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!canManage}
                                        onChange={() =>
                                            setRoles((prev) =>
                                                prev.includes(role)
                                                    ? prev.filter((r) => r !== role)
                                                    : [...prev, role]
                                            )
                                        }
                                        className="h-4 w-4 rounded"
                                    />
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-lg border border-border p-4 bg-white dark:bg-gray-900">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={requireSelf}
                            disabled={!canManage}
                            onChange={(e) => setRequireSelf(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded"
                        />
                        <div>
                            <p className="text-sm font-medium text-primary">
                                Yalnızca atanan kişi
                            </p>
                            <p className="mt-1 text-xs leading-5 text-secondary">
                                Bu geçiş yalnızca görevin atanmış kullanıcısı tarafından gerçekleştirilebilir.
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            <div className="mt-auto border-t border-border p-4 bg-white dark:bg-gray-900">
                {canManage && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdate(roles, requireSelf)}
                            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition cursor-pointer"
                        >
                            Kaydet
                        </button>
                        <button
                            onClick={onDelete}
                            className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 transition cursor-pointer"
                        >
                            Sil
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}