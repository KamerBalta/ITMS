import { useState } from 'react';
import { Modal } from './Modal';
import { useCreateTask, useParentCandidates } from '../hooks/useTasks';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useProjectIssueTypes } from '../hooks/useProjectIssueTypes';
import { useAuthStore } from '../store/authStore';
import type { Priority } from '../types/task';
import { PRIORITY_LABELS } from '../types/task';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api';

interface CreateTaskModalProps {
    projectId: string | null;
    sprintId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CreateTaskModal({ projectId, sprintId, isOpen, onClose }: CreateTaskModalProps) {
    const { data: members } = useProjectMembers(projectId);
    const { data: issueTypes } = useProjectIssueTypes(projectId);
    const { data: parentCandidates } = useParentCandidates(projectId);
    const createTask = useCreateTask(projectId ?? '');
    const currentUser = useAuthStore((state) => state.user);

    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const isDeveloper = currentUser?.roles.includes('Developer') ?? false;
    const isAdmin = currentUser?.roles.includes('System Admin') ?? false;

    const [title, setTitle] = useState('');
    const [issueTypeId, setIssueTypeId] = useState('');
    const [priority, setPriority] = useState<Priority>(1);
    const [storyPoint, setStoryPoint] = useState<string>('');
    const [assigneeId, setAssigneeId] = useState('');
    const [parentTaskId, setParentTaskId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

    // Yalnizca bu projeye atanmis VE global olarak aktif olan tipler + rol bazli CreatorTier filtresi
    const availableIssueTypes = (issueTypes ?? []).filter((t) => {
        if (!t.isActive) return false;
        if (t.creatorTier === 2) return isAdmin || isPM;
        if (t.creatorTier === 1) return isAdmin || isPM || isDeveloper;
        return true;
    });

    const selectedType = issueTypes?.find((t) => t.issueTypeId === issueTypeId);
    const assignableMembers = isPM ? members : members?.filter((m) => m.userId === currentUser?.userId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!projectId) {
            setError('Görev oluşturmak için önce üstteki menüden bir proje seçin.');
            return;
        }
        if (!issueTypeId) {
            setError('Bir issue type seçmelisiniz.');
            return;
        }
        if (selectedType?.requiresParent && !parentTaskId) {
            setError(`'${selectedType.name}' tipi mutlaka bir üst göreve bağlanmalıdır.`);
            return;
        }

        try {
            await createTask.mutateAsync({
                projectId,
                sprintId: sprintId ?? null,
                parentTaskId: parentTaskId || null,
                issueTypeId,
                title,
                priority,
                storyPoint: storyPoint ? Number(storyPoint) : null,
                assigneeId: assigneeId || null,
            });
            setTitle('');
            setIssueTypeId('');
            setStoryPoint('');
            setAssigneeId('');
            setParentTaskId('');
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
            {!projectId ? (
                <p className="text-sm text-gray-500">Devam etmek için üstteki menüden bir proje seçin.</p>
            ) : issueTypes && issueTypes.length === 0 ? (
                <p className="text-sm text-red-500">
                    Bu proje için tanımlı Issue Type bulunmamaktadır. Görev oluşturmadan önce Proje Detay &gt; Issue Types
                    ekranından en az bir tip atayın.
                </p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {!sprintId && (
                        <p className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1.5">
                            Bu görev doğrudan Backlog'a eklenecek (aktif sprint dışında).
                        </p>
                    )}

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
                            value={issueTypeId}
                            onChange={(e) => {
                                setIssueTypeId(e.target.value);
                                setParentTaskId('');
                            }}
                            required
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="">Issue Type seçin...</option>
                            {availableIssueTypes.map((t) => (
                                <option key={t.issueTypeId} value={t.issueTypeId}>
                                    {t.icon ? `${t.icon} ` : ''}{t.name}
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

                    {selectedType && (selectedType.requiresParent || !selectedType.allowsChildren) && (
                        <select
                            value={parentTaskId}
                            onChange={(e) => setParentTaskId(e.target.value)}
                            required={selectedType.requiresParent}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            <option value="">
                                {selectedType.requiresParent ? 'Üst görev seçin (zorunlu)' : 'Bir üst göreve bağlama (opsiyonel)'}
                            </option>
                            {(parentCandidates ?? []).map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    )}

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
            )}
        </Modal>
    );
}