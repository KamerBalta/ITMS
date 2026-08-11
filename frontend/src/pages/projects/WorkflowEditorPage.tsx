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
    addEdge,
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
        bg: '#f8fafc',
        border: '#cbd5e1',
        text: '#475569',
        dot: '#64748b',
    },
    InProgress: {
        bg: '#eff6ff',
        border: '#93c5fd',
        text: '#1d4ed8',
        dot: '#3b82f6',
    },
    ReadyForReview: {
        bg: '#fffbeb',
        border: '#fcd34d',
        text: '#b45309',
        dot: '#f59e0b',
    },
    ReadyForQA: {
        bg: '#faf5ff',
        border: '#d8b4fe',
        text: '#7e22ce',
        dot: '#a855f7',
    },
    Done: {
        bg: '#ecfdf5',
        border: '#86efac',
        text: '#047857',
        dot: '#10b981',
    },
    Closed: {
        bg: '#f3f4f6',
        border: '#d1d5db',
        text: '#4b5563',
        dot: '#6b7280',
    },
};

type WorkflowNodeData = {
    status: string;
    transitionCount: number;
};

type WorkflowNode = Node<WorkflowNodeData, 'workflowStatus'>;

type WorkflowEdgeData = {
    transitionId?: string;
    allowedRoles: string[];
    requireAssigneeSelf: boolean;
};

function WorkflowStatusNode({
    data,
}: NodeProps<WorkflowNode>) {
    const colors = STATUS_COLORS[data.status] ?? STATUS_COLORS.ToDo;

    return (
        <div
            className="relative min-w-[190px] rounded-xl border-2 bg-white shadow-sm"
            style={{
                borderColor: colors.border,
            }}
        >
            {/* Incoming connection */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !border-2 !border-white"
                style={{ background: colors.dot }}
            />

            {/* Header */}
            <div
                className="px-4 py-3 rounded-t-xl"
                style={{ backgroundColor: colors.bg }}
            >
                <div className="flex items-center gap-2">
                    <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: colors.dot }}
                    />

                    <span
                        className="text-sm font-bold"
                        style={{ color: colors.text }}
                    >
                        {STATUS_LABELS[data.status] ?? data.status}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3 bg-white rounded-b-xl">
                <div className="text-[11px] text-gray-400">
                    {data.transitionCount} geçiş
                </div>
            </div>

            {/* Outgoing connection */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !border-2 !border-white"
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

    const isAdmin =
        user?.roles.includes('System Admin') ?? false;

    const { data: project } = useProjectDetail(projectId ?? null);

    const canManage =
        isAdmin ||
        (
            user?.roles.includes('Project Manager') &&
            project?.ownerName === user?.email
        );

    const {
        data: transitions,
        isLoading,
    } = useWorkflowTransitions(projectId ?? null);

    const createTransition = useCreateTransition(projectId!);
    const updateTransition = useUpdateTransition(projectId!);
    const deleteTransition = useDeleteTransition(projectId!);

    const [selectedTransition, setSelectedTransition] =
        useState<WorkflowTransition | null>(null);

    const [isAddOpen, setIsAddOpen] = useState(false);

    const [newFrom, setNewFrom] = useState('ToDo');
    const [newTo, setNewTo] = useState('InProgress');

    const [newRoles, setNewRoles] = useState<string[]>([]);

    const [newRequireSelf, setNewRequireSelf] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const initialNodes = useMemo<WorkflowNode[]>(() => {
        const positions: Record<
            string,
            { x: number; y: number }
        > = {
            ToDo: {
                x: 50,
                y: 100,
            },
            InProgress: {
                x: 350,
                y: 100,
            },
            ReadyForReview: {
                x: 650,
                y: 100,
            },
            ReadyForQA: {
                x: 950,
                y: 100,
            },
            Done: {
                x: 1250,
                y: 50,
            },
            Closed: {
                x: 1250,
                y: 220,
            },
        };

        return ALL_STATUSES.map((status) => ({
            id: status,
            type: 'workflowStatus',
            position: positions[status],
            data: {
                status,
                transitionCount:
                    transitions?.filter(
                        (t) => t.fromStatus === status
                    ).length ?? 0,
            },
        }));
    }, [transitions]);

    const initialEdges = useMemo<Edge[]>(() => {
        return (transitions ?? []).map((transition) => ({
            id: transition.id,

            source: transition.fromStatus,
            target: transition.toStatus,

            type: 'smoothstep',

            animated:
                transition.fromStatus === 'InProgress',

            markerEnd: {
                type: MarkerType.ArrowClosed,
            },

            style: {
                strokeWidth: 2,
                stroke: '#94a3b8',
            },

            label:
                transition.allowedRoles.length > 0
                    ? transition.allowedRoles.join(', ')
                    : 'Rol yok',

            labelStyle: {
                fontSize: 10,
                fill: '#64748b',
                fontWeight: 500,
            },

            labelBgStyle: {
                fill: '#ffffff',
                fillOpacity: 0.9,
            },

            data: {
                transitionId: transition.id,
                allowedRoles: transition.allowedRoles,
                requireAssigneeSelf:
                    transition.requireAssigneeSelf,
            },
        }));
    }, [transitions]);

    const [nodes, setNodes, onNodesChange] =
        useNodesState<WorkflowNode>(initialNodes);

    const [edges, setEdges, onEdgesChange] =
        useEdgesState(initialEdges);

    useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    useEffect(() => {
        setEdges(initialEdges);
    }, [initialEdges, setEdges]);

    const onConnect = useCallback(
        async (connection: Connection) => {
            if (!canManage) return;

            if (
                !connection.source ||
                !connection.target
            ) {
                return;
            }

            if (connection.source === connection.target) {
                setError(
                    'Bir durum kendisine geçiş yapamaz.'
                );
                return;
            }

            const exists = transitions?.some(
                (t) =>
                    t.fromStatus === connection.source &&
                    t.toStatus === connection.target
            );

            if (exists) {
                setError(
                    'Bu geçiş zaten tanımlanmış.'
                );
                return;
            }

            setError(null);

            try {
                await createTransition.mutateAsync({
                    fromStatus: connection.source,
                    toStatus: connection.target,
                    allowedRoles: [
                        'Developer',
                        'Project Manager',
                        'System Admin',
                    ],
                    requireAssigneeSelf: false,
                });
            } catch (err) {
                const axiosError =
                    err as AxiosError<ApiErrorResponse>;

                setError(
                    axiosError.response?.data?.message ??
                    'Workflow geçişi oluşturulamadı.'
                );
            }
        },
        [
            canManage,
            transitions,
            createTransition,
        ]
    );

    const handleEdgeClick = (
        _event: React.MouseEvent,
        edge: Edge
    ) => {
        const transitionId =
            edge.data?.transitionId;

        if (!transitionId) return;

        const transition =
            transitions?.find(
                (t) => t.id === transitionId
            );

        if (transition) {
            setSelectedTransition(transition);
        }
    };

    const handleDelete = async (
        transition: WorkflowTransition
    ) => {
        if (
            !confirm(
                `"${transition.fromStatus} → ${transition.toStatus}" geçişini silmek istediğinize emin misiniz?`
            )
        ) {
            return;
        }

        try {
            await deleteTransition.mutateAsync(
                transition.id
            );

            setSelectedTransition(null);
        } catch (err) {
            const axiosError =
                err as AxiosError<ApiErrorResponse>;

            setError(
                axiosError.response?.data?.message ??
                'Geçiş silinemedi.'
            );
        }
    };

    const handleCreate = async () => {
        if (newFrom === newTo) {
            setError(
                'Başlangıç ve hedef durumu aynı olamaz.'
            );
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
            const axiosError =
                err as AxiosError<ApiErrorResponse>;

            setError(
                axiosError.response?.data?.message ??
                'Geçiş oluşturulamadı.'
            );
        }
    };

    if (!projectId) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <p className="text-sm text-gray-500">
                    Workflow yükleniyor...
                </p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">

                <div>
                    <Link
                        to={`/projects/${projectId}`}
                        className="text-sm text-indigo-600 hover:underline"
                    >
                        ← Proje Detayına Dön
                    </Link>

                    <h1 className="text-2xl font-bold mt-2">
                        Workflow Editörü
                    </h1>

                    <p className="text-sm text-gray-400 mt-1">
                        Durumlar arasındaki geçişleri
                        sürükleyerek oluşturabilir ve
                        geçişlerin rollerini yönetebilirsiniz.
                    </p>
                </div>

                {canManage && (
                    <button
                        onClick={() => {
                            setError(null);
                            setIsAddOpen(true);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                        + Yeni Geçiş
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* React Flow */}
            <div className="flex-1 min-h-0 border border-gray-200 rounded-xl overflow-hidden bg-slate-50">

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeClick={handleEdgeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{
                        padding: 0.2,
                    }}
                    nodesConnectable={canManage}
                    nodesDraggable={canManage}
                    elementsSelectable
                    attributionPosition="bottom-left"
                >
                    <Background
                        gap={20}
                        size={1}
                    />

                    <Controls />

                    <MiniMap
                        nodeColor={(node) => {
                            const status =
                                (node.data as WorkflowNodeData)
                                    ?.status;

                            return (
                                STATUS_COLORS[status]
                                    ?.dot ?? '#94a3b8'
                            );
                        }}
                    />
                </ReactFlow>
            </div>

            {/* Selected transition panel */}
            {selectedTransition && (
                <TransitionPanel
                    transition={selectedTransition}
                    canManage={canManage}
                    onClose={() =>
                        setSelectedTransition(null)
                    }
                    onUpdate={async (
                        roles,
                        requireSelf
                    ) => {
                        try {
                            await updateTransition.mutateAsync(
                                {
                                    id:
                                        selectedTransition.id,
                                    data: {
                                        allowedRoles:
                                            roles,
                                        requireAssigneeSelf:
                                            requireSelf,
                                    },
                                }
                            );

                            setSelectedTransition(
                                null
                            );
                        } catch (err) {
                            const axiosError =
                                err as AxiosError<ApiErrorResponse>;

                            setError(
                                axiosError.response
                                    ?.data?.message ??
                                'Geçiş güncellenemedi.'
                            );
                        }
                    }}
                    onDelete={() =>
                        handleDelete(
                            selectedTransition
                        )
                    }
                />
            )}

            {/* Add transition modal */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

                        <h2 className="text-lg font-semibold">
                            Yeni Workflow Geçişi
                        </h2>

                        <p className="text-xs text-gray-400 mt-1 mb-5">
                            Hangi durumdan hangi duruma
                            geçilebileceğini tanımlayın.
                        </p>

                        <div className="grid grid-cols-2 gap-3">

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Başlangıç
                                </label>

                                <select
                                    value={newFrom}
                                    onChange={(e) =>
                                        setNewFrom(
                                            e.target.value
                                        )
                                    }
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                >
                                    {ALL_STATUSES.map(
                                        (status) => (
                                            <option
                                                key={status}
                                                value={status}
                                            >
                                                {STATUS_LABELS[
                                                    status
                                                ] ?? status}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Hedef
                                </label>

                                <select
                                    value={newTo}
                                    onChange={(e) =>
                                        setNewTo(
                                            e.target.value
                                        )
                                    }
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                >
                                    {ALL_STATUSES.map(
                                        (status) => (
                                            <option
                                                key={status}
                                                value={status}
                                            >
                                                {STATUS_LABELS[
                                                    status
                                                ] ?? status}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="mt-5">

                            <p className="text-xs font-medium text-gray-500 mb-2">
                                İzin verilen roller
                            </p>

                            <div className="grid grid-cols-2 gap-2">

                                {ALL_ROLES.map((role) => (
                                    <label
                                        key={role}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={newRoles.includes(
                                                role
                                            )}
                                            onChange={() =>
                                                setNewRoles(
                                                    (prev) =>
                                                        prev.includes(
                                                            role
                                                        )
                                                            ? prev.filter(
                                                                (r) =>
                                                                    r !==
                                                                    role
                                                            )
                                                            : [
                                                                ...prev,
                                                                role,
                                                            ]
                                                )
                                            }
                                        />

                                        {role}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm mt-5">
                            <input
                                type="checkbox"
                                checked={newRequireSelf}
                                onChange={(e) =>
                                    setNewRequireSelf(
                                        e.target.checked
                                    )
                                }
                            />

                            Yalnızca atanan kişi
                        </label>

                        <div className="flex gap-2 mt-6">

                            <button
                                onClick={() =>
                                    setIsAddOpen(false)
                                }
                                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm"
                            >
                                İptal
                            </button>

                            <button
                                onClick={handleCreate}
                                disabled={
                                    createTransition.isPending
                                }
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                {createTransition.isPending
                                    ? 'Oluşturuluyor...'
                                    : 'Oluştur'}
                            </button>

                        </div>
                    </div>
                </div>
            )}
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
    onUpdate: (
        roles: string[],
        requireSelf: boolean
    ) => Promise<void>;
    onDelete: () => void;
}) {
    const [roles, setRoles] = useState<string[]>(
        transition.allowedRoles
    );

    const [requireSelf, setRequireSelf] =
        useState<boolean>(
            transition.requireAssigneeSelf
        );

    return (
        <div className="fixed right-6 top-24 z-40 w-80 bg-white border border-gray-200 rounded-xl shadow-xl">

            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                    <p className="text-sm font-semibold">
                        Workflow Geçişi
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                        {STATUS_LABELS[
                            transition.fromStatus
                        ]}{' '}
                        →{' '}
                        {STATUS_LABELS[
                            transition.toStatus
                        ]}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-4">

                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                        İzin verilen roller
                    </p>

                    <div className="space-y-2">

                        {ALL_ROLES.map((role) => (
                            <label
                                key={role}
                                className="flex items-center gap-2 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={roles.includes(
                                        role
                                    )}
                                    disabled={!canManage}
                                    onChange={() =>
                                        setRoles(
                                            (prev) =>
                                                prev.includes(
                                                    role
                                                )
                                                    ? prev.filter(
                                                        (r) =>
                                                            r !==
                                                            role
                                                    )
                                                    : [
                                                        ...prev,
                                                        role,
                                                    ]
                                        )
                                    }
                                />

                                {role}
                            </label>
                        ))}
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={requireSelf}
                        disabled={!canManage}
                        onChange={(e) =>
                            setRequireSelf(
                                e.target.checked
                            )
                        }
                    />

                    Yalnızca atanan kişi
                </label>

                {canManage && (
                    <div className="flex gap-2 pt-2 border-t">

                        <button
                            onClick={() =>
                                onUpdate(
                                    roles,
                                    requireSelf
                                )
                            }
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700"
                        >
                            Kaydet
                        </button>

                        <button
                            onClick={onDelete}
                            className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50"
                        >
                            Sil
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}