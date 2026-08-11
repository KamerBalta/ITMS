import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
} from '@xyflow/react';

export type WorkflowEdgeData = {
    roles: string[];
    requireAssigneeSelf: boolean;
};

export function WorkflowEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const edgeData = data as WorkflowEdgeData | undefined;

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    strokeWidth: 2,
                    stroke: '#6366f1',
                }}
            />

            <EdgeLabelRenderer>
                <div
                    className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2"
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                    }}
                >
                    <div className="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm">
                        <div className="text-[10px] text-gray-500 whitespace-nowrap">
                            {edgeData?.roles?.join(', ') || 'Rol yok'}
                        </div>

                        {edgeData?.requireAssigneeSelf && (
                            <div className="text-[9px] text-indigo-500">
                                Yalnızca atanan
                            </div>
                        )}
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}