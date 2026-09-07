import { useState, useImperativeHandle, forwardRef } from 'react';
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

const taskDetailUrl = (issueKey: string) => `/browse/${issueKey}`;

export interface SubtasksSectionHandle {
    openAddForm: () => void;
}

interface SubtasksSectionProps {
    taskId: string;
    projectId: string;
    canAdd: boolean;
}

export const SubtasksSection = forwardRef<SubtasksSectionHandle, SubtasksSectionProps>(
    ({ taskId, projectId, canAdd }, ref) => {
        const { data: subtasks } = useTasks(projectId, { parentTaskId: taskId });
        const { data: members } = useProjectMembers(projectId);
        const createSubtask = useCreateSubtask(taskId, projectId);

        const [isAdding, setIsAdding] = useState(false);
        const [title, setTitle] = useState('');
        const [assigneeId, setAssigneeId] = useState('');
        const [error, setError] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            openAddForm: () => {
                if (canAdd) {
                    setIsAdding(true);
                }
            },
        }));

        if (!canAdd && (!subtasks || subtasks.length === 0)) return null;

        const handleAdd = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!title.trim()) return;
            setError(null);
            try {
                await createSubtask.mutateAsync({ title, assigneeId: assigneeId || null });
                setTitle('');
                setAssigneeId('');
                setIsAdding(false);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Alt görev oluşturulamadı.';
                setError(message);
            }
        };

        return (
            <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl p-4 mt-6 space-y-4">
                {/* Başlık ve Buton Alanı */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-primary text-base">
                            Sub-tasks / Alt Görevler
                        </h3>
                        {subtasks && subtasks.length > 0 && (
                            <span className="text-xs surface-muted text-secondary font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                                {subtasks.length}
                            </span>
                        )}
                        {canAdd && !isAdding && (
                            <button
                                type="button"
                                onClick={() => setIsAdding(true)}
                                title="Alt görev ekle"
                                className="p-1 text-secondary hover:text-primary hover-surface rounded-md transition cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {canAdd && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding((v) => !v);
                                setError(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold text-secondary hover-surface transition shadow-2xs cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5 text-muted" />
                            {isAdding ? 'Vazgeç' : 'Create subtask'}
                        </button>
                    )}
                </div>

                {/* Subtask Listesi */}
                {!subtasks || subtasks.length === 0 ? (
                    !isAdding && (
                        <div className="surface-muted border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center">
                            <p className="text-xs font-medium text-muted">Henüz alt görev yok.</p>
                            {canAdd && (
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(true)}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 inline-block cursor-pointer"
                                >
                                    İlk alt görevi oluştur
                                </button>
                            )}
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
                                    {/* Sol: İkon + Issue Key + Başlık */}
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span title="Sub-task" className="inline-flex shrink-0">
                                            <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                        </span>
                                        <Link
                                            to={taskDetailUrl(st.issueKey)}
                                            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate min-w-0"
                                        >
                                            {st.issueKey && (
                                                <span className="text-xs text-muted font-mono shrink-0">
                                                    {st.issueKey}
                                                </span>
                                            )}
                                            <span className="truncate">{st.title}</span>
                                        </Link>
                                    </div>

                                    {/* Sağ: Assignee + Status + Menü */}
                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
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
                                                <span className="text-xs text-muted italic">Atanmamış</span>
                                            )}
                                        </div>

                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase border shrink-0 ${STATUS_COLORS[st.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            {STATUS_LABELS[st.status] ?? st.status}
                                        </span>

                                        <button
                                            type="button"
                                            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-primary rounded hover-surface transition cursor-pointer"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Yeni Ekleme Formu */}
                {canAdd && isAdding && (
                    <form onSubmit={handleAdd} className="surface-muted border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">Yeni Alt Görev (Sub-task)</p>

                        <div>
                            <input
                                type="text"
                                placeholder="Ne yapılması gerekiyor? (Summary)"
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
                                    <option value="">Atanan: Atanmamış</option>
                                    {members?.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            Atanan: {m.userName}
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
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createSubtask.isPending}
                                    className="px-4 py-1.5 text-xs bg-indigo-600 font-semibold text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                                >
                                    {createSubtask.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-red-500 dark:text-red-400 text-xs font-medium mt-1">{error}</p>}
                    </form>
                )}
            </div>
        );
    }
);