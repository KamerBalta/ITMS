import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../../../hooks/useTasks';
import { useCreateSubtask } from '../../../hooks/useTaskDetail';
import { useProjectMembers } from '../../../hooks/useProjectMembers';
import { MoreHorizontal, Plus, CheckSquare } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    ToDo: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    InProgress: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    ReadyForReview: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    ReadyForQA: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    Done: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    Closed: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

const STATUS_LABELS: Record<string, string> = {
    ToDo: 'TO DO',
    InProgress: 'IN PROGRESS',
    ReadyForReview: 'IN REVIEW',
    ReadyForQA: 'IN QA',
    Done: 'DONE',
    Closed: 'CLOSED',
};

export function SubtasksSection({ taskId, projectId }: { taskId: string; projectId: string }) {
    const { data: subtasks } = useTasks(projectId, { parentTaskId: taskId });
    const { data: members } = useProjectMembers(projectId);
    const createSubtask = useCreateSubtask(taskId, projectId);

    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setError(null);
        try {
            await createSubtask.mutateAsync({ title, assigneeId: assigneeId || null });
            setTitle('');
            setAssigneeId('');
            setIsAdding(false);
        } catch {
            setError('Alt görev oluşturulamadı (yetkiniz olmayabilir veya aktif sprintte olabilir).');
        }
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-6 space-y-4">
            {/* Başlık ve Buton Alanı */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-primary text-base">Subtasks</h3>
                    {subtasks && subtasks.length > 0 && (
                        <span className="text-xs surface-muted text-secondary font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                            {subtasks.length} items
                        </span>
                    )}
                </div>

                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold text-secondary hover-surface transition shadow-2xs cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 text-muted" />
                        Create subtask
                    </button>
                )}
            </div>

            {/* Subtask Listesi */}
            {!subtasks || subtasks.length === 0 ? (
                !isAdding && (
                    <div className="surface-muted border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center">
                        <p className="text-xs font-medium text-muted">No subtasks created yet.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 inline-block cursor-pointer"
                        >
                            Create the first subtask
                        </button>
                    </div>
                )
            ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 surface shadow-2xs">
                    {subtasks.map((st) => {
                        const assigneeInitial = st.assigneeName ? st.assigneeName.charAt(0).toUpperCase() : null;

                        return (
                            <div
                                key={st.id}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 hover-surface transition gap-2 sm:gap-4"
                            >
                                {/* Sol: İkon + Başlık */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" title="Sub-task" />
                                    <Link
                                        to={`/tasks/${st.id}`}
                                        className="text-sm font-medium text-primary hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate"
                                    >
                                        {st.title}
                                    </Link>
                                </div>

                                {/* Sağ: Assignee Avatar + Status + Aksiyonlar */}
                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                    {/* Assignee Avatar */}
                                    <div className="flex items-center gap-1.5 min-w-[100px] justify-end">
                                        {assigneeInitial ? (
                                            <>
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                                                    {assigneeInitial}
                                                </div>
                                                <span className="text-xs text-secondary font-medium truncate max-w-[80px]">
                                                    {st.assigneeName}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-muted italic">Unassigned</span>
                                        )}
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase border shrink-0 ${STATUS_COLORS[st.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {STATUS_LABELS[st.status] ?? st.status}
                                    </span>

                                    {/* Hover Aksiyon Menüsü */}
                                    <button className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-primary rounded hover-surface transition cursor-pointer">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isAdding && (
                <form onSubmit={handleAdd} className="surface-muted border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider">New Subtask</p>

                    <div>
                        <input
                            type="text"
                            placeholder="What needs to be done?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                            className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="w-full sm:w-60">
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="">Assignee: Unassigned</option>
                                {members?.map((m) => (
                                    <option key={m.userId} value={m.userId}>
                                        Assignee: {m.userName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setError(null);
                                }}
                                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 font-medium rounded-lg hover-surface text-secondary transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createSubtask.isPending}
                                className="px-4 py-1.5 text-xs bg-indigo-600 font-semibold text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                            >
                                {createSubtask.isPending ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 dark:text-red-400 text-xs font-medium mt-1">{error}</p>}
                </form>
            )}
        </div>
    );
}