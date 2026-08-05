import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { TaskListItem, Priority } from '../types/task';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../types/task';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useReassignTask } from '../hooks/useTasks';
import { useAuthStore } from '../store/authStore';

const PRIORITY_NAME_TO_NUM: Record<string, Priority> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

interface TaskCardProps {
    task: TaskListItem;
    projectId: string;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

export function TaskCard({ task, projectId, draggable, onDragStart }: TaskCardProps) {
    const priorityNum = PRIORITY_NAME_TO_NUM[task.priority] ?? 1;
    const currentUser = useAuthStore((state) => state.user);
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const [isReassigning, setIsReassigning] = useState(false);
    const { data: members } = useProjectMembers(isReassigning ? projectId : null);
    const reassign = useReassignTask(projectId);

    const handleReassign = async (userId: string) => {
        await reassign.mutateAsync({ taskId: task.id, assigneeId: userId || null });
        setIsReassigning(false);
    };

    return (
        <Link
            to={`/tasks/${task.id}`}
            draggable={draggable}
            onDragStart={(e) => onDragStart?.(e, task.id)}
            className="block bg-white border rounded-md p-3 shadow-sm hover:shadow cursor-pointer space-y-2"
        >
            <p className="text-sm font-medium line-clamp-2">{task.title}</p>

            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{task.issueType}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[priorityNum]}`}>
                    {PRIORITY_LABELS[priorityNum]}
                </span>
                {task.storyPoint !== null && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">
                        {task.storyPoint} SP
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                {isReassigning ? (
                    <select
                        autoFocus
                        defaultValue={task.assigneeName ?? ''}
                        onChange={(e) => handleReassign(e.target.value)}
                        onBlur={() => setIsReassigning(false)}
                        className="text-xs border rounded px-1 py-0.5"
                    >
                        <option value="">Atanmamış</option>
                        {members?.map((m) => (
                            <option key={m.userId} value={m.userId}>
                                {m.userName}
                            </option>
                        ))}
                    </select>
                ) : (
                    <span
                        className={`text-xs text-gray-400 ${isPM ? 'hover:text-indigo-600 hover:underline' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            if (isPM) setIsReassigning(true);
                        }}
                    >
                        {task.assigneeName ?? 'Atanmamış'}
                    </span>
                )}
            </div>
        </Link>
    );
}