import { useState } from 'react';
import { Modal } from './Modal';
import { useCreateTask, useParentCandidates } from '../hooks/useTasks';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useProjectIssueTypes } from '../hooks/useProjectIssueTypes';
import { useComponents } from '../hooks/useComponents';
import { useCustomFields } from '../hooks/useCustomFields';
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
    const { data: components } = useComponents(projectId);
    const { data: customFields } = useCustomFields(projectId);
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
    const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
    const [customFieldDrafts, setCustomFieldDrafts] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

    const toggleComponent = (componentId: string) => {
        setSelectedComponentIds((prev) => {
            const next = prev.includes(componentId)
                ? prev.filter((id) => id !== componentId)
                : [...prev, componentId];

            // Ilk secilen component'in lead'i varsa ve assignee henuz elle secilmediyse otomatik oner
            if (!prev.includes(componentId) && !assigneeId) {
                const comp = components?.find((c) => c.id === componentId);
                if (comp?.leadUserId) setAssigneeId(comp.leadUserId);
            }

            return next;
        });
    };

    const setCustomFieldValue = (fieldId: string, value: string) => {
        setCustomFieldDrafts((prev) => ({ ...prev, [fieldId]: value }));
    };

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

        const missingRequiredField = customFields?.find(
            (f) => f.isRequired && !customFieldDrafts[f.id]?.trim()
        );
        if (missingRequiredField) {
            setError(`'${missingRequiredField.name}' alanı zorunludur.`);
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
                componentIds: selectedComponentIds,
                customFieldValues: customFieldDrafts,
            });
            setTitle('');
            setIssueTypeId('');
            setStoryPoint('');
            setAssigneeId('');
            setParentTaskId('');
            setSelectedComponentIds([]);
            setCustomFieldDrafts({});
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
                        <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1.5">
                            Bu görev doğrudan Backlog'a eklenecek (aktif sprint dışında).
                        </p>
                    )}

                    <input
                        type="text"
                        placeholder="Görev başlığı"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full border rounded px-3 py-2 text-sm input-base"
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={issueTypeId}
                            onChange={(e) => {
                                setIssueTypeId(e.target.value);
                                setParentTaskId('');
                            }}
                            required
                            className="border rounded px-3 py-2 text-sm input-base"
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
                            className="border rounded px-3 py-2 text-sm input-base"
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
                            className="w-full border rounded px-3 py-2 text-sm input-base"
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

                    {components && components.length > 0 && (
                        <div>
                            <p className="text-xs text-muted mb-1">Component(ler) (opsiyonel)</p>
                            <div className="flex flex-wrap gap-1.5">
                                {components.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => toggleComponent(c.id)}
                                        className={`text-xs px-2 py-1 rounded-full border transition cursor-pointer ${selectedComponentIds.includes(c.id)
                                                ? 'bg-teal-100 dark:bg-teal-950 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 font-medium'
                                                : 'border-gray-200 dark:border-gray-600 text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <select
                        value={storyPoint}
                        onChange={(e) => setStoryPoint(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm input-base"
                    >
                        <option value="">Story Point (opsiyonel)</option>
                        {FIBONACCI.map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>

                    {customFields && customFields.length > 0 && (
                        <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                            <p className="text-xs text-muted">Özel Alanlar</p>
                            {customFields.map((f) => (
                                <div key={f.id}>
                                    <label className="text-xs text-secondary">
                                        {f.name}
                                        {f.isRequired && <span className="text-red-400"> *</span>}
                                    </label>
                                    {f.fieldType === 'user' ? (
                                        <select
                                            value={customFieldDrafts[f.id] ?? ''}
                                            onChange={(e) => setCustomFieldValue(f.id, e.target.value)}
                                            className="w-full input-base border rounded px-3 py-2 text-sm mt-1"
                                        >
                                            <option value="">-</option>
                                            {assignableMembers?.map((m) => (
                                                <option key={m.userId} value={m.userId}>{m.userName}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={f.fieldType === 'number' ? 'number' : 'text'}
                                            value={customFieldDrafts[f.id] ?? ''}
                                            onChange={(e) => setCustomFieldValue(f.id, e.target.value)}
                                            className="w-full input-base border rounded px-3 py-2 text-sm mt-1"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div>
                        <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm input-base"
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
                        className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 font-medium transition cursor-pointer"
                    >
                        {createTask.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                    </button>
                </form>
            )}
        </Modal>
    );
}