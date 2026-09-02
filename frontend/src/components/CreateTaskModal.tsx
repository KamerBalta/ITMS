import { useState, useRef } from 'react';
import {
    useCreateTask,
    useProjectTasksForParentSelection,
    filterEpicCandidates,
    filterSubtaskParentCandidates,
} from '../hooks/useTasks';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useProjectIssueTypes } from '../hooks/useProjectIssueTypes';
import { useComponents } from '../hooks/useComponents';
import { useAllLabels } from '../hooks/useTaskDetail';
import { useCreateLabel } from '../hooks/useLabels';
import { useCustomFields } from '../hooks/useCustomFields';
import { useSprints } from '../hooks/useSprints';
import { useProjectDetail } from '../hooks/useProjects';
import { useIssueTemplates } from '../hooks/useIssueTemplates';
import { useSimilarTasks } from '../hooks/useSimilarTasks';
import { useAuthStore } from '../store/authStore';
import { Modal } from './Modal';
import { MultiSelectSearch } from './MultiSelectSearch';
import { RichTextEditor } from './RichTextEditor';
import { attachmentsApi } from '../api/taskDetail';
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

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

export function CreateTaskModal({
    projectId,
    sprintId: defaultSprintId,
    isOpen,
    onClose,
}: CreateTaskModalProps) {
    const currentUser = useAuthStore((state) => state.user);
    const isAdmin = currentUser?.roles.includes('System Admin') ?? false;
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const isDeveloper = currentUser?.roles.includes('Developer') ?? false;

    // #Perf: Modal kapalıyken hiçbir sorgu tetiklenmez
    const fetchEnabled = isOpen && !!projectId;

    const { data: project } = useProjectDetail(fetchEnabled ? projectId : null);
    const { data: members } = useProjectMembers(fetchEnabled ? projectId : null);
    const { data: issueTypes } = useProjectIssueTypes(fetchEnabled ? projectId : null);
    const { data: components } = useComponents(fetchEnabled ? projectId : null);
    const { data: labels } = useAllLabels();
    const { data: customFields } = useCustomFields(fetchEnabled ? projectId : null);
    const { data: sprints } = useSprints(fetchEnabled ? projectId : null);
    const { data: templates } = useIssueTemplates(fetchEnabled ? projectId : null);
    const createLabel = useCreateLabel();
    const createTask = useCreateTask(projectId ?? '');

    // Form State
    const [issueTypeId, setIssueTypeId] = useState('');
    const [templateApplied, setTemplateApplied] = useState(false);
    const [title, setTitle] = useState('');
    const { data: similarTasks } = useSimilarTasks(projectId, title, isOpen);
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>(1);
    const [storyPoint, setStoryPoint] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [parentTaskId, setParentTaskId] = useState('');
    const [selectedSprintId, setSelectedSprintId] = useState(defaultSprintId ?? '');
    const [dueDate, setDueDate] = useState('');
    const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
    const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
    const [customFieldDrafts, setCustomFieldDrafts] = useState<Record<string, string>>({});
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | null>(null);
    const [uploadingAttachments, setUploadingAttachments] = useState(false);

    // Parent / Epic logic & gating
    const selectedType = issueTypes?.find(
        (t) => (t.issueTypeId ?? (t as { id?: string }).id) === issueTypeId
    );
    const selectedTypeName = selectedType?.name?.trim().toLowerCase();
    const isEpicType = selectedTypeName === 'epic';
    const requiresParent = selectedType?.requiresParent === true;

    // #Perf: Epic tipi seçili DEĞİLSE ve bir tip seçildiyse parent adaylarını çek
    const needsParentCandidates = fetchEnabled && !!issueTypeId && !isEpicType;

    const { data: allProjectTasks, isLoading: isParentTasksLoading } = useProjectTasksForParentSelection(
        projectId,
        !!needsParentCandidates
    );
    const epicCandidates = filterEpicCandidates(allProjectTasks);
    const subtaskParentCandidates = filterSubtaskParentCandidates(allProjectTasks);

    const activeSprints = (sprints ?? []).filter((s) => s.status === 'Active');

    const availableIssueTypes = (issueTypes ?? []).filter((t) => {
        if (!t.isActive) return false;
        if (t.creatorTier === 2) return isAdmin || isPM;
        if (t.creatorTier === 1) return isAdmin || isPM || isDeveloper;
        return true;
    });

    const assignableMembers = isPM ? members : members?.filter((m) => m.userId === currentUser?.userId);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setIssueTypeId('');
        setTemplateApplied(false);
        setPriority(1);
        setStoryPoint('');
        setAssigneeId('');
        setParentTaskId('');
        setSelectedSprintId(defaultSprintId ?? '');
        setDueDate('');
        setSelectedComponentIds([]);
        setSelectedLabelIds([]);
        setCustomFieldDrafts({});
        setPendingFiles([]);
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setPendingFiles((prev) => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCreateLabelInline = async (name: string) => {
        const result = await createLabel.mutateAsync({ name });
        return { id: result.id, name };
    };

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
        if (requiresParent && !parentTaskId) {
            setError('Sub-task oluşturabilmek için bir üst görev (Story, Task, Bug vb.) seçmelisiniz.');
            return;
        }

        const missingRequiredField = customFields?.find((f) => f.isRequired && !customFieldDrafts[f.id]?.trim());
        if (missingRequiredField) {
            setError(`'${missingRequiredField.name}' alanı zorunludur.`);
            return;
        }

        try {
            const result = await createTask.mutateAsync({
                projectId,
                sprintId: selectedSprintId || null,
                parentTaskId: parentTaskId || null,
                issueTypeId,
                title,
                description: description || undefined,
                priority,
                storyPoint: storyPoint ? Number(storyPoint) : null,
                assigneeId: assigneeId || null,
                dueDate: dueDate || null,
                componentIds: selectedComponentIds,
                labelIds: selectedLabelIds,
                customFieldValues: customFieldDrafts,
            });

            if (pendingFiles.length > 0) {
                setUploadingAttachments(true);
                for (const file of pendingFiles) {
                    try {
                        await attachmentsApi.upload(result.id, file);
                    } catch {
                        // Dosya hatası ana görevin oluşumunu bozmaz
                    }
                }
                setUploadingAttachments(false);
            }

            resetForm();
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
        <Modal title="Create Issue" isOpen={isOpen} onClose={onClose} size="xl">
            {!projectId ? (
                <p className="text-sm text-muted">Devam etmek için üstteki menüden bir proje seçin.</p>
            ) : issueTypes && issueTypes.length === 0 ? (
                <p className="text-sm text-red-500">
                    Bu proje için tanımlı Issue Type bulunmamaktadır. Görev oluşturmadan önce Proje Detay &gt; Issue Types
                    ekranından en az bir tip atayın.
                </p>
            ) : (
                <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-1 flex flex-col justify-between">
                    <div className="space-y-5 pb-6">
                        {/* 1. Project (Salt-Okunur Alan) */}
                        <div>
                            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                Project
                            </label>
                            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <span className="text-sm font-medium text-primary">{project?.name}</span>
                                <span className="text-xs text-muted font-mono">({project?.key})</span>
                            </div>
                        </div>

                        {/* 2. Issue Type + Priority + Assignee */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                    Issue Type *
                                </label>
                                <select
                                    value={issueTypeId}
                                    onChange={(e) => {
                                        const newTypeId = e.target.value;
                                        setIssueTypeId(newTypeId);
                                        setParentTaskId('');
                                        setTemplateApplied(false);

                                        // #3: bu Issue Type icin varsayilan bir sablon varsa VE kullanici henuz elle
                                        // description/priority girmediyse, otomatik uygula. Kullanicinin zaten yazdigi
                                        // bir metnin ustune YAZMA -- sessizce veri kaybina yol acmasin.
                                        const defaultTemplate = templates?.find((t) => t.issueTypeId === newTypeId && t.isDefault);
                                        if (defaultTemplate && !description.trim()) {
                                            if (defaultTemplate.descriptionTemplate) setDescription(defaultTemplate.descriptionTemplate);
                                            if (defaultTemplate.defaultPriority !== null && defaultTemplate.defaultPriority !== undefined) {
                                                setPriority(defaultTemplate.defaultPriority as Priority);
                                            }
                                            setTemplateApplied(true);
                                        }
                                    }}
                                    required
                                    className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                >
                                    <option value="">Seçin...</option>
                                    {availableIssueTypes.map((t) => (
                                        <option key={t.issueTypeId} value={t.issueTypeId}>
                                            {t.icon ? `${t.icon} ` : ''}{t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                    Priority
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(Number(e.target.value) as Priority)}
                                    className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                >
                                    {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                    Assignee
                                </label>
                                <select
                                    value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}
                                    className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                >
                                    <option value="">Atanmamış bırak</option>
                                    {assignableMembers?.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.userName} {m.teamName ? `(${m.teamName})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {!isPM && (
                                    <p className="text-[11px] text-muted mt-1 leading-tight">Yalnızca kendinize atayabilirsiniz.</p>
                                )}
                            </div>
                        </div>

                        {/* 3. Summary & Similar Tasks Detection */}
                        <div>
                            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                Summary *
                            </label>
                            <input
                                type="text"
                                placeholder="What needs to be done?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full h-10 input-base border rounded-md px-3 text-sm"
                            />

                            {similarTasks && similarTasks.length > 0 && (
                                <div className="mt-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-md px-3 py-2 space-y-1">
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                                        ⚠️ Benzer başlıklı {similarTasks.length} görev bulundu — bu bir kopya olabilir mi?
                                    </p>
                                    <div className="space-y-1 pt-1">
                                        {similarTasks.map((t) => (
                                            <a
                                                key={t.id}
                                                href={`/tasks/${t.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                {t.issueKey} — {t.title} <span className="text-muted">({t.statusName})</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Description */}
                        <div>
                            <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <span>Description</span>
                                {templateApplied && (
                                    <span className="text-[10px] lowercase font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                                        (şablon uygulandı)
                                    </span>
                                )}
                            </label>
                            <div className="mt-1">
                                <RichTextEditor
                                    value={description}
                                    onChange={setDescription}
                                    members={members}
                                    placeholder="Add a description..."
                                    rows={7}
                                />
                            </div>
                        </div>

                        {/* 5. Parent + Sprint + Story Point + Due Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Parent / Epic */}
                            {requiresParent ? (
                                <div>
                                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                        Parent *
                                    </label>
                                    <select
                                        value={parentTaskId}
                                        onChange={(e) => setParentTaskId(e.target.value)}
                                        required
                                        className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                    >
                                        <option value="">
                                            {isParentTasksLoading ? 'Yükleniyor...' : 'Üst görev seçin (zorunlu)'}
                                        </option>
                                        {(subtaskParentCandidates ?? []).map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.issueKey ? `${p.issueKey} — ` : ''}{p.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : issueTypeId && isEpicType ? null : (
                                <div>
                                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                        Epic (Üst Görev)
                                    </label>
                                    <select
                                        value={parentTaskId}
                                        onChange={(e) => setParentTaskId(e.target.value)}
                                        className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                    >
                                        <option value="">
                                            {isParentTasksLoading ? 'Yükleniyor...' : 'Bağlama (opsiyonel — Epic)'}
                                        </option>
                                        {(epicCandidates ?? []).map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.issueKey ? `${p.issueKey} — ` : ''}{p.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Sprint */}
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                    Sprint
                                </label>
                                <select
                                    value={selectedSprintId}
                                    onChange={(e) => setSelectedSprintId(e.target.value)}
                                    className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                >
                                    <option value="">Backlog</option>
                                    {activeSprints.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} (Aktif)</option>
                                    ))}
                                </select>
                            </div>

                            {/* Story Point */}
                            <div>
                                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                    Story Point
                                </label>
                                <select
                                    value={storyPoint}
                                    onChange={(e) => setStoryPoint(e.target.value)}
                                    className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                >
                                    <option value="">-</option>
                                    {FIBONACCI.map((v) => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Due Date */}
                            {isPM && (
                                <div>
                                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 6. Components & Labels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <MultiSelectSearch
                                    label="Components"
                                    items={(components ?? []).map((c) => ({ id: c.id, name: c.name }))}
                                    selectedIds={selectedComponentIds}
                                    onToggle={(id) =>
                                        setSelectedComponentIds((prev) =>
                                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                                        )
                                    }
                                    placeholder="Component ara..."
                                />
                            </div>

                            <div>
                                <MultiSelectSearch
                                    label="Labels"
                                    items={(labels ?? []).map((l) => ({ id: l.id, name: l.name }))}
                                    selectedIds={selectedLabelIds}
                                    onToggle={(id) =>
                                        setSelectedLabelIds((prev) =>
                                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                                        )
                                    }
                                    onCreate={handleCreateLabelInline}
                                    placeholder="Etiket ara ya da yeni oluştur..."
                                />
                            </div>
                        </div>

                        {/* 7. Custom Fields */}
                        {customFields && customFields.length > 0 && (
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
                                    Custom Fields
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {customFields.map((f) => (
                                        <div key={f.id}>
                                            <label className="block text-xs text-secondary mb-1">
                                                {f.name}
                                                {f.isRequired && <span className="text-red-500"> *</span>}
                                            </label>
                                            {f.fieldType === 'select' ? (
                                                <select
                                                    value={customFieldDrafts[f.id] ?? ''}
                                                    onChange={(e) =>
                                                        setCustomFieldDrafts((prev) => ({ ...prev, [f.id]: e.target.value }))
                                                    }
                                                    className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                                >
                                                    <option value="">-</option>
                                                    {(() => {
                                                        try {
                                                            return (JSON.parse(f.optionsJson ?? '[]') as string[]).map((opt) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ));
                                                        } catch {
                                                            return null;
                                                        }
                                                    })()}
                                                </select>
                                            ) : f.fieldType === 'user' ? (
                                                <select
                                                    value={customFieldDrafts[f.id] ?? ''}
                                                    onChange={(e) =>
                                                        setCustomFieldDrafts((prev) => ({ ...prev, [f.id]: e.target.value }))
                                                    }
                                                    className="w-full h-10 input-base border rounded-md px-3 text-sm"
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
                                                    onChange={(e) =>
                                                        setCustomFieldDrafts((prev) => ({ ...prev, [f.id]: e.target.value }))
                                                    }
                                                    className="w-full h-10 input-base border rounded-md px-3 text-sm"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 8. Attachments */}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                                    Attachments
                                </label>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    + Add attachment
                                </button>
                                <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} className="hidden" />
                            </div>

                            {pendingFiles.length > 0 && (
                                <ul className="space-y-1.5 mt-2">
                                    {pendingFiles.map((file, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-3 py-2"
                                        >
                                            <span className="text-secondary truncate">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removePendingFile(i)}
                                                className="text-red-400 hover:text-red-600 shrink-0 ml-3 text-xs font-bold"
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="text-xs text-muted mt-1.5">Dosyalar görev oluşturulduktan hemen sonra sisteme yüklenecektir.</p>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>

                    {/* 9. Sticky Footer */}
                    <div className="sticky bottom-0 -mx-1 px-4 py-3 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 items-center mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createTask.isPending || uploadingAttachments}
                            className="px-5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {createTask.isPending
                                ? 'Creating...'
                                : uploadingAttachments
                                    ? 'Uploading...'
                                    : 'Create'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}