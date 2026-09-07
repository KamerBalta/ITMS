import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { TaskListItem, Priority } from '../types/task';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../types/task';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useReassignTask } from '../hooks/useTasks';
import { useUpdateTaskStoryPoint } from '../hooks/useTaskDetail';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';

const PRIORITY_NAME_TO_NUM: Record<string, Priority> = { Low: 0, Medium: 1, High: 2, Critical: 3 };
const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

const taskDetailUrl = (issueKey: string) => `/browse/${issueKey}`;

interface TaskCardProps {
    task: TaskListItem;
    projectId: string;
    subtasks?: TaskListItem[];
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

export function TaskCard({ task, projectId, subtasks, draggable, onDragStart }: TaskCardProps) {
    const priorityNum = PRIORITY_NAME_TO_NUM[task.priority] ?? 1;
    const currentUser = useAuthStore((state) => state.user);
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const isDeveloper = currentUser?.roles.includes('Developer') ?? false;
    const canEditStoryPoint = isPM || (isDeveloper && task.assigneeId === currentUser?.userId);

    const [isReassigning, setIsReassigning] = useState(false);
    const [isEditingSP, setIsEditingSP] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { data: members } = useProjectMembers(isReassigning ? projectId : null);
    const reassign = useReassignTask(projectId);
    const updateStoryPoint = useUpdateTaskStoryPoint(task.id);

    const handleReassign = async (userId: string) => {
        await reassign.mutateAsync({ taskId: task.id, assigneeId: userId || null });
        setIsReassigning(false);
    };

    const handleStoryPointChange = async (value: string) => {
        await updateStoryPoint.mutateAsync(value ? Number(value) : null);
        setIsEditingSP(false);
    };

    const hasSubtasks = subtasks && subtasks.length > 0;

    return (
        <div className="surface border rounded-md shadow-sm hover:shadow dark:hover:shadow-black/30">
            <Link
                to={taskDetailUrl(task.issueKey)}
                draggable={draggable}
                onDragStart={(e) => onDragStart?.(e, task.id)}
                className="block p-3 space-y-2"
            >
                <p className="text-xs text-muted font-mono">{task.issueKey}</p>
                <p className="text-sm font-medium line-clamp-2 text-primary">{task.title}</p>

                <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-secondary">{task.issueType}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[priorityNum]}`}>{PRIORITY_LABELS[priorityNum]}</span>

                    {isEditingSP ? (
                        <select
                            autoFocus
                            defaultValue={task.storyPoint ?? ''}
                            onChange={(e) => handleStoryPointChange(e.target.value)}
                            onBlur={() => setIsEditingSP(false)}
                            className="text-xs input-base border rounded px-1 py-0.5"
                            onClick={(e) => e.preventDefault()}
                        >
                            <option value="">-</option>
                            {FIBONACCI.map((v) => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    ) : (
                        <span
                            onClick={(e) => {
                                e.preventDefault();
                                if (canEditStoryPoint) setIsEditingSP(true);
                            }}
                            className={`text-xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium ${canEditStoryPoint ? 'hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer' : ''
                                }`}
                        >
                            {task.storyPoint !== null ? `${task.storyPoint} SP` : canEditStoryPoint ? '+ SP' : ''}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    {isReassigning ? (
                        <select
                            autoFocus
                            defaultValue={task.assigneeId ?? ''}
                            onChange={(e) => handleReassign(e.target.value)}
                            onBlur={() => setIsReassigning(false)}
                            className="text-xs input-base border rounded px-1 py-0.5"
                            onClick={(e) => e.preventDefault()}
                        >
                            <option value="">Atanmamış</option>
                            {members?.map((m) => (
                                <option key={m.userId} value={m.userId}>{m.userName}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            {task.assigneeId && task.assigneeName && <Avatar userId={task.assigneeId} name={task.assigneeName} size="xs" />}
                            <span
                                className={`text-xs text-muted ${isPM ? 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (isPM) setIsReassigning(true);
                                }}
                            >
                                {task.assigneeName ?? 'Atanmamış'}
                            </span>
                        </div>
                    )}
                </div>
            </Link>

            {hasSubtasks && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsExpanded((v) => !v);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-muted hover-surface flex items-center gap-1"
                    >
                        <span>{isExpanded ? '▾' : '▸'}</span>
                        {subtasks!.length} alt görev
                    </button>

                    {isExpanded && (
                        <div className="pl-3 pb-2 space-y-1">
                            {subtasks!.map((st) => (
                                <Link key={st.id} to={taskDetailUrl(st.issueKey)} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded hover-surface">
                                    <span className="truncate flex-1 text-secondary">{st.title}</span>
                                    <span className="text-muted shrink-0">{st.assigneeName ?? '-'}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}