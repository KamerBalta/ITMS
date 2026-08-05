import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../../../hooks/useTasks';
import { useCreateSubtask } from '../../../hooks/useTaskDetail';
import { useProjectMembers } from '../../../hooks/useProjectMembers';
import { MoreHorizontal, Plus, CheckSquare } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    ToDo: 'bg-slate-100 text-slate-700 border-slate-200',
    InProgress: 'bg-blue-50 text-blue-700 border-blue-200',
    ReadyForReview: 'bg-amber-50 text-amber-700 border-amber-200',
    ReadyForQA: 'bg-purple-50 text-purple-700 border-purple-200',
    Done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Closed: 'bg-gray-100 text-gray-600 border-gray-200',
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
        <div className="border-t border-gray-200 pt-5 mt-6 space-y-4">
            {/* Başlık ve Buton Alanı */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-base">Subtasks</h3>
                    {subtasks && subtasks.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full border border-gray-200">
                            {subtasks.length} items
                        </span>
                    )}
                </div>

                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
                    >
                        <Plus className="w-3.5 h-3.5 text-gray-500" />
                        Create subtask
                    </button>
                )}
            </div>

            {/* Subtask Listesi */}
            {!subtasks || subtasks.length === 0 ? (
                !isAdding && (
                    <div className="bg-slate-50 border border-dashed border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-xs font-medium text-gray-500">No subtasks created yet.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-xs text-indigo-600 font-semibold hover:underline mt-1 inline-block"
                        >
                            Create the first subtask
                        </button>
                    </div>
                )
            ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-2xs">
                    {subtasks.map((st) => {
                        const assigneeInitial = st.assigneeName ? st.assigneeName.charAt(0).toUpperCase() : null;

                        return (
                            <div
                                key={st.id}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-50 transition gap-2 sm:gap-4"
                            >
                                {/* Sol: İkon + Başlık */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" title="Sub-task" />
                                    <Link
                                        to={`/tasks/${st.id}`}
                                        className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition truncate"
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
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-indigo-200 shrink-0">
                                                    {assigneeInitial}
                                                </div>
                                                <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">
                                                    {st.assigneeName}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Unassigned</span>
                                        )}
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase border shrink-0 ${STATUS_COLORS[st.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}
                                    >
                                        {STATUS_LABELS[st.status] ?? st.status}
                                    </span>

                                    {/* Hover Aksiyon Menüsü */}
                                    <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200/60 transition">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            
            {isAdding && (
                <form onSubmit={handleAdd} className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Subtask</p>

                    <div>
                        <input
                            type="text"
                            placeholder="What needs to be done?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="w-full sm:w-60">
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="px-3 py-1.5 text-xs border border-gray-300 font-medium rounded-lg hover:bg-white text-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createSubtask.isPending}
                                className="px-4 py-1.5 text-xs bg-indigo-600 font-semibold text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                {createSubtask.isPending ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-xs font-medium mt-1">{error}</p>}
                </form>
            )}
        </div>
    );
}