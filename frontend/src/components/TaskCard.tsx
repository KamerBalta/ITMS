import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { TaskListItem, Priority } from '../types/task';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../types/task';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useReassignTask } from '../hooks/useTasks';
import { useAuthStore } from '../store/authStore';
import {
    Bug,
    Bookmark,
    CheckSquare,
    Layers,
    ArrowUp,
    ArrowDown,
    Minus,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

const PRIORITY_NAME_TO_NUM: Record<string, Priority> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

const ISSUE_ICON = {
    Bug,
    Story: Bookmark,
    Task: CheckSquare,
    Epic: Layers,
};

const ISSUE_COLOR: Record<string, string> = {
    Bug: 'text-red-500 fill-red-500/10',
    Story: 'text-emerald-500 fill-emerald-500',
    Task: 'text-blue-500 fill-blue-500/10',
    Epic: 'text-purple-500 fill-purple-500/10',
};

const STATUS_DOT: Record<string, string> = {
    ToDo: 'bg-slate-300',
    InProgress: 'bg-blue-500',
    ReadyForReview: 'bg-amber-400',
    ReadyForQA: 'bg-purple-500',
    Done: 'bg-emerald-500',
    Closed: 'bg-slate-400',
};

// Öncelik İkonları (ArrowUp / Minus / ArrowDown)
function PriorityIcon({ priorityNum }: { priorityNum: Priority }) {
    switch (priorityNum) {
        case 3: // Critical / Highest
        case 2: // High
            return <ArrowUp size={12} className="stroke-[3]" />;
        case 1: // Medium
            return <Minus size={12} className="stroke-[3]" />;
        case 0: // Low
        default:
            return <ArrowDown size={12} className="stroke-[3]" />;
    }
}

interface TaskCardProps {
    task: TaskListItem;
    projectId: string;
    subtasks?: TaskListItem[]; // Alt görevler
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

export function TaskCard({ task, projectId, subtasks, draggable, onDragStart }: TaskCardProps) {
    const priorityNum = PRIORITY_NAME_TO_NUM[task.priority] ?? 1;
    const currentUser = useAuthStore((state) => state.user);
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const [isReassigning, setIsReassigning] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const { data: members } = useProjectMembers(isReassigning ? projectId : null);
    const reassign = useReassignTask(projectId);

    const handleReassign = async (userId: string) => {
        await reassign.mutateAsync({ taskId: task.id, assigneeId: userId || null });
        setIsReassigning(false);
    };

    // İsimden baş harfleri türetme (örn: Ayşe Demir -> AD)
    const initials = task.assigneeName
        ? task.assigneeName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '?';

    const IssueIcon = ISSUE_ICON[task.issueType as keyof typeof ISSUE_ICON] ?? CheckSquare;
    const iconColor = ISSUE_COLOR[task.issueType] ?? 'text-slate-500';
    const hasSubtasks = subtasks && subtasks.length > 0;

    return (
        <div className="bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-2xs transition text-slate-800 mb-2 overflow-hidden select-none">
            <Link
                to={`/tasks/${task.id}`}
                draggable={draggable}
                onDragStart={(e) => onDragStart?.(e, task.id)}
                className="block p-3 space-y-2 cursor-pointer"
            >
                {/* Üst Satır: Jira İkonu + Başlık */}
                <div className="flex items-center gap-2">
                    <IssueIcon
                        size={16}
                        className={`${iconColor} shrink-0`}
                    />
                    <p className="text-xs text-gray-400 font-mono">{task.issueKey}</p>
                    <p className="text-xs font-semibold text-slate-800 truncate flex-1 leading-snug">{task.title}</p>
                </div>

                {/* Alt Satır: Öncelik (İkonlu) & Atanan (Sol) - Story Point (Sağ) */}
                <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                    {/* Sol Taraf */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Öncelik Rozeti */}
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${PRIORITY_COLORS[priorityNum]}`}>
                            <PriorityIcon priorityNum={priorityNum} />
                            <span>{PRIORITY_LABELS[priorityNum]}</span>
                        </span>

                        {/* Atanan Kullanıcı */}
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center min-w-0">
                            {isReassigning ? (
                                <select
                                    autoFocus
                                    defaultValue={task.assigneeName ?? ''}
                                    onChange={(e) => handleReassign(e.target.value)}
                                    onBlur={() => setIsReassigning(false)}
                                    className="text-[11px] border border-slate-300 rounded px-1 py-0.5 bg-white max-w-[110px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Atanmamış</option>
                                    {members?.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.userName}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <button
                                    type="button"
                                    title={task.assigneeName ?? 'Atanmamış'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (isPM) setIsReassigning(true);
                                    }}
                                    className={`flex items-center gap-1.5 min-w-0 ${isPM ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold flex items-center justify-center border border-slate-200 shrink-0">
                                        {initials}
                                    </div>
                                    <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-[80px]">
                                        {task.assigneeName ?? 'Atanmamış'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sağ Taraf: Story Point */}
                    {task.storyPoint !== null && task.storyPoint !== undefined && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200 shrink-0 whitespace-nowrap leading-none">
                            {task.storyPoint} SP
                        </span>
                    )}
                </div>
            </Link>

            {/* Alt Görevler (Subtasks) Bölümü */}
            {hasSubtasks && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsExpanded((v) => !v);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{subtasks.length} alt görev</span>
                    </button>

                    {isExpanded && (
                        <div className="px-3 pb-2 pt-1 space-y-1 border-t border-slate-100">
                            {subtasks.map((st) => (
                                <Link
                                    key={st.id}
                                    to={`/tasks/${st.id}`}
                                    className="flex items-center gap-2 text-[11px] px-2 py-1 rounded-md hover:bg-white hover:shadow-2xs transition text-slate-700 group"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[st.status] ?? 'bg-slate-300'}`} />
                                    <span className="truncate flex-1 font-medium group-hover:text-blue-600">{st.title}</span>
                                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{st.assigneeName ?? '-'}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}