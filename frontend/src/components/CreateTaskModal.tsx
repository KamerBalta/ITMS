import { useState } from 'react';
import { Modal } from './Modal';
import { useCreateTask } from '../hooks/useTasks';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useAuthStore } from '../store/authStore';
import type { IssueType, Priority } from '../types/task';
import { ISSUE_TYPE_LABELS, PRIORITY_LABELS } from '../types/task';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api';

interface CreateTaskModalProps {
    projectId: string;
    sprintId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CreateTaskModal({ projectId, sprintId, isOpen, onClose }: CreateTaskModalProps) {
    const { data: members } = useProjectMembers(projectId);
    const createTask = useCreateTask(projectId);
    const currentUser = useAuthStore((state) => state.user);

    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const [title, setTitle] = useState('');
    const [issueType, setIssueType] = useState<IssueType>(2);
    const [priority, setPriority] = useState<Priority>(1);
    const [storyPoint, setStoryPoint] = useState<string>('');
    const [assigneeId, setAssigneeId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

    // PM/Admin herkesi gorebilir, Developer/QA yalnizca kendini secebilir (frontend tarafi kisit --
    // backend'de assignee'nin ProjectMembers'da olmasi zaten dogrulaniyor)
    const assignableMembers = isPM
        ? members
        : members?.filter((m) => m.userId === currentUser?.userId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await createTask.mutateAsync({
                projectId,
                sprintId: sprintId ?? null,
                title,
                issueType,
                priority,
                storyPoint: storyPoint ? Number(storyPoint) : null,
                assigneeId: assigneeId || null,
            });
            setTitle('');
            setStoryPoint('');
            setAssigneeId('');
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            const message =
                axiosError.response?.data?.message ??
                axiosError.response?.data?.errors?.map((x) => x.message).join(', ') ??
                'Görev oluşturulamadı.';
            setError(message);
        }
    };

    return (
        <Modal title="Yeni Görev Oluştur" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="Görev başlığı"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2 text-sm"
                />

                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={issueType}
                        onChange={(e) => setIssueType(Number(e.target.value) as IssueType)}
                        className="border rounded px-3 py-2 text-sm"
                    >
                        {Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value) as Priority)}
                        className="border rounded px-3 py-2 text-sm"
                    >
                        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                <select
                    value={storyPoint}
                    onChange={(e) => setStoryPoint(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="">Story Point (opsiyonel)</option>
                    {FIBONACCI.map((v) => (
                        <option key={v} value={v}>
                            {v}
                        </option>
                    ))}
                </select>

                <div>
                    <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        <option value="">Atanmamış bırak</option>
                        {assignableMembers?.map((m) => (
                            <option key={m.userId} value={m.userId}>
                                {m.userName} ({m.teamName})
                            </option>
                        ))}
                    </select>
                    {!isPM && (
                        <p className="text-xs text-gray-400 mt-1">
                            Yalnızca kendinize atayabilirsiniz. Başkasına atama için Project Manager gerekir.
                        </p>
                    )}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={createTask.isPending}
                    className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {createTask.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
            </form>
        </Modal>
    );
}