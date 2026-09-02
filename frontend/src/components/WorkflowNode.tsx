import { Handle, Position, type NodeProps } from '@xyflow/react';

export type WorkflowNodeData = {
    label: string;
    color: string;
};

export function WorkflowNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as WorkflowNodeData;

    return (
        <div
            className={`
        min-w-[180px]
        rounded-xl
        border-2
        bg-white
        shadow-sm
        transition
        ${selected ? 'border-indigo-500 shadow-lg' : 'border-gray-200'}
      `}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-indigo-500"
            />

            <div className={`h-2 rounded-t-xl ${nodeData.color}`} />

            <div className="px-4 py-4">
                <div className="text-sm font-semibold text-gray-800">
                    {nodeData.label}
                </div>

                <div className="mt-1 text-xs text-gray-400">
                    Workflow Status
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-indigo-500"
            />
        </div>
    );
}