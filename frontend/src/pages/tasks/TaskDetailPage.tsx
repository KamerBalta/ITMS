import { useParams, Link } from 'react-router-dom';
import { useTaskDetail } from '../../hooks/useTaskDetail';
import { useUpdateTaskStatus } from '../../hooks/useTasks';
import { STATUS_TO_INT } from '../../lib/taskStatus';
import type { ItemStatus } from '../../types/task';
import { CommentsSection } from './sections/CommentsSection';
import { AttachmentsSection } from './sections/AttachmentsSection';
import { ChecklistSection } from './sections/ChecklistSection';
import { WatchersSection } from './sections/WatchersSection';
import { WorkLogsSection } from './sections/WorkLogsSection';
import { LabelsSection } from './sections/LabelsSection';

const ALL_STATUSES: ItemStatus[] = ['ToDo', 'InProgress', 'ReadyForReview', 'ReadyForQA', 'Done', 'Closed'];

export function TaskDetailPage() {
    const { taskId } = useParams<{ taskId: string }>();
    const { data: task, isLoading } = useTaskDetail(taskId ?? null);
    const updateStatus = useUpdateTaskStatus(task?.projectId ?? '');

    if (isLoading || !task) return <p className="text-gray-500">Yükleniyor...</p>;

    const handleStatusChange = async (newStatus: string) => {
        try {
            await updateStatus.mutateAsync({ taskId: task.id, status: STATUS_TO_INT[newStatus as ItemStatus] });
        } catch {
            alert('Bu durum geçişine yetkiniz yok veya geçiş kuralına aykırı.');
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            <Link to={-1 as unknown as string} className="text-sm text-indigo-600 hover:underline">
                ← Geri
            </Link>

            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{task.issueType}</span>
                        {task.parentTaskId && (
                            <Link to={`/tasks/${task.parentTaskId}`} className="text-xs text-indigo-600 hover:underline">
                                Üst görev
                            </Link>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold">{task.title}</h1>
                </div>

                <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="border rounded px-3 py-2 text-sm font-medium"
                >
                    {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            {task.description && <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>}

            <LabelsSection taskId={task.id} currentLabels={task.labels} />

            <div className="grid grid-cols-3 gap-4 text-sm bg-white border rounded-lg p-4">
                <div>
                    <p className="text-gray-400">Öncelik</p>
                    <p className="font-medium">{task.priority}</p>
                </div>
                <div>
                    <p className="text-gray-400">Story Point</p>
                    <p className="font-medium">{task.storyPoint ?? '-'}</p>
                </div>
                <div>
                    <p className="text-gray-400">Atanan</p>
                    <p className="font-medium">{task.assigneeName ?? 'Atanmamış'}</p>
                </div>
                <div>
                    <p className="text-gray-400">Raportör</p>
                    <p className="font-medium">{task.reporterName}</p>
                </div>
                <div>
                    <p className="text-gray-400">Teslim Tarihi</p>
                    <p className="font-medium">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '-'}</p>
                </div>
                <div>
                    <p className="text-gray-400">Oluşturulma</p>
                    <p className="font-medium">{new Date(task.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
            </div>

            <WatchersSection taskId={task.id} watcherCount={task.watcherCount} />
            <ChecklistSection taskId={task.id} />
            <WorkLogsSection taskId={task.id} />
            <AttachmentsSection taskId={task.id} />
            <CommentsSection taskId={task.id} />
        </div>
    );
}