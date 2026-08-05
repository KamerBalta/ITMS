import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    useTaskDetail,
    useUpdateTaskStatus,
    useUpdateTaskTitle,
    useUpdateTaskDescription,
    useUpdateTaskPriority,
    useUpdateTaskStoryPoint,
    useUpdateTaskDueDate,
    useReassignTaskDetail,
    useCloseEpic,
    useUpdateTaskRelease,
    useUploadAttachment,
} from '../../hooks/useTaskDetail';
import { useReleases } from '../../hooks/useReleases';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import type { ItemStatus, Priority } from '../../types/task';
import { CommentsSection } from './sections/CommentsSection';
import { AttachmentsSection } from './sections/AttachmentsSection';
import { ChecklistSection } from './sections/ChecklistSection';
import { WatchersSection } from './sections/WatchersSection';
import { WorkLogsSection } from './sections/WorkLogsSection';
import { LabelsSection } from './sections/LabelsSection';
import { SubtasksSection } from './sections/SubtasksSection';
import { MentionTextarea } from '../../components/MentionTextarea';
import { TaskBreadcrumb } from '../../components/TaskBreadcrumb';
import {
    CheckCircle2,
    Paperclip,
    UserCheck,
    ArrowUp,
    ArrowDown,
    Minus,
    AlertOctagon,
    Plus,
    Link2,
    Share2,
    MoreHorizontal,
    Bold,
    Italic,
    Code,
    List,
    AtSign,
    AlertCircle
} from 'lucide-react';

const ALL_STATUSES: { value: ItemStatus; label: string; color: string }[] = [
    { value: 'ToDo', label: 'TO DO', color: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' },
    { value: 'InProgress', label: 'IN PROGRESS', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { value: 'ReadyForReview', label: 'IN REVIEW', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    { value: 'ReadyForQA', label: 'READY FOR QA', color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
    { value: 'Done', label: 'DONE', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { value: 'Closed', label: 'CLOSED', color: 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 0, label: 'Low', icon: <ArrowDown size={14} className="text-blue-500" />, color: 'text-blue-600' },
    { value: 1, label: 'Medium', icon: <Minus size={14} className="text-amber-500" />, color: 'text-amber-600' },
    { value: 2, label: 'High', icon: <ArrowUp size={14} className="text-orange-500" />, color: 'text-orange-600' },
    { value: 3, label: 'Critical', icon: <AlertOctagon size={14} className="text-red-600" />, color: 'text-red-600' },
];

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

interface Draft {
    title: string;
    description: string;
    priority: Priority;
    storyPoint: string;
    dueDate: string;
    status: ItemStatus;
    assigneeId: string;
    releaseId: string;
}

export function TaskDetailPage() {
    const { taskId } = useParams<{ taskId: string }>();
    const currentUser = useAuthStore((state) => state.user);
    const { data: task, isLoading } = useTaskDetail(taskId ?? null);

    const updateStatus = useUpdateTaskStatus(task?.projectId ?? '');
    const updateTitle = useUpdateTaskTitle(taskId ?? '');
    const updateDescription = useUpdateTaskDescription(taskId ?? '');
    const updatePriority = useUpdateTaskPriority(taskId ?? '');
    const updateStoryPoint = useUpdateTaskStoryPoint(taskId ?? '');
    const updateDueDate = useUpdateTaskDueDate(taskId ?? '');
    const updateRelease = useUpdateTaskRelease(taskId ?? '');
    const reassign = useReassignTaskDetail(taskId ?? '', task?.projectId ?? '');
    const closeEpic = useCloseEpic(taskId ?? '', task?.projectId ?? '');
    const uploadAttachment = useUploadAttachment(taskId ?? '');
    const { data: members } = useProjectMembers(task?.projectId ?? null);
    const { data: releases } = useReleases(task?.projectId ?? null);

    // Referanslar (File Input & Textarea)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [draft, setDraft] = useState<Draft | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [closeEpicError, setCloseEpicError] = useState<string | null>(null);
    const [activeActivityTab, setActiveActivityTab] = useState<'comments' | 'worklogs' | 'attachments'>('comments');

    useEffect(() => {
        if (task) {
            setDraft({
                title: task.title,
                description: task.description ?? '',
                priority: PRIORITY_NAME_TO_NUM(task.priority),
                storyPoint: task.storyPoint?.toString() ?? '',
                dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
                status: task.status,
                assigneeId: members?.find((m) => m.userName === task.assigneeName)?.userId ?? '',
                releaseId: task.releaseId ?? '',
            });
        }
    }, [task?.id, task?.updatedAt, members]);

    if (isLoading || !task || !draft) {
        return <TaskDetailSkeleton />;
    }

    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const isDeveloper = currentUser?.roles.includes('Developer') ?? false;
    const isAssignee =
        task.assigneeName !== null && members?.some((m) => m.userName === task.assigneeName && m.userId === currentUser?.userId);

    const canEditTitle = isPM;
    const canEditDescription = isPM || isAssignee;
    const canEditPriority = isPM;
    const canEditStoryPoint = isPM || (isAssignee && isDeveloper);
    const canEditDueDate = isPM;
    const canReassign = isPM;
    const canEditRelease = isPM;

    const isDirty =
        draft.title !== task.title ||
        draft.description !== (task.description ?? '') ||
        draft.priority !== PRIORITY_NAME_TO_NUM(task.priority) ||
        draft.storyPoint !== (task.storyPoint?.toString() ?? '') ||
        draft.dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : '') ||
        draft.status !== task.status ||
        draft.assigneeId !== (members?.find((m) => m.userName === task.assigneeName)?.userId ?? '') ||
        draft.releaseId !== (task.releaseId ?? '');

    // Dosya Yükleme Eylemleri
    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await uploadAttachment.mutateAsync(file);
            e.target.value = '';
        } catch {
            alert('Dosya yüklenirken bir hata oluştu.');
        }
    };

    // Açıklama Markdown Araç Çubuğu İşlevi
    const insertFormat = (prefix: string, suffix: string = prefix) => {
        const textarea = textareaRef.current;
        if (!textarea || !draft) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = draft.description.substring(start, end);

        const newText =
            draft.description.substring(0, start) +
            prefix +
            selectedText +
            suffix +
            draft.description.substring(end);

        setDraft({ ...draft, description: newText });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const handleCancel = () => {
        setDraft({
            title: task.title,
            description: task.description ?? '',
            priority: PRIORITY_NAME_TO_NUM(task.priority),
            storyPoint: task.storyPoint?.toString() ?? '',
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
            status: task.status,
            assigneeId: members?.find((m) => m.userName === task.assigneeName)?.userId ?? '',
            releaseId: task.releaseId ?? '',
        });
        setSaveError(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);

        const jobs: Promise<unknown>[] = [];

        if (canEditTitle && draft.title !== task.title) jobs.push(updateTitle.mutateAsync(draft.title));
        if (canEditDescription && draft.description !== (task.description ?? ''))
            jobs.push(updateDescription.mutateAsync(draft.description));
        if (canEditPriority && draft.priority !== PRIORITY_NAME_TO_NUM(task.priority))
            jobs.push(updatePriority.mutateAsync(draft.priority));
        if (canEditStoryPoint && draft.storyPoint !== (task.storyPoint?.toString() ?? ''))
            jobs.push(updateStoryPoint.mutateAsync(draft.storyPoint ? Number(draft.storyPoint) : null));
        if (canEditDueDate && draft.dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : ''))
            jobs.push(updateDueDate.mutateAsync(draft.dueDate || null));
        if (draft.status !== task.status)
            jobs.push(updateStatus.mutateAsync({ taskId: task.id, status: STATUS_TO_INT[draft.status] }));
        if (canReassign && draft.assigneeId !== (members?.find((m) => m.userName === task.assigneeName)?.userId ?? ''))
            jobs.push(reassign.mutateAsync(draft.assigneeId || null));
        if (canEditRelease && draft.releaseId !== (task.releaseId ?? ''))
            jobs.push(updateRelease.mutateAsync(draft.releaseId || null));

        const results = await Promise.allSettled(jobs);
        const failed = results.filter((r) => r.status === 'rejected');

        setIsSaving(false);

        if (failed.length > 0) {
            setSaveError(
                `${failed.length} değişiklik kaydedilemedi (yetki veya iş kuralı ihlali olabilir). Diğer değişiklikler kaydedildi.`
            );
        }
    };

    const handleCloseEpic = async () => {
        setCloseEpicError(null);
        if (!confirm("Bu Epic'i kapatmak istediğinize emin misiniz?")) return;
        try {
            await closeEpic.mutateAsync();
        } catch {
            setCloseEpicError("Epic kapatılamadı — tüm alt görevler Done olmalı.");
        }
    };

    const handleAssignToMe = () => {
        if (!currentUser?.userId || !canReassign) return;
        setDraft((prev) => (prev ? { ...prev, assigneeId: currentUser.userId } : null));
    };

    const currentPriorityObj = PRIORITY_OPTIONS.find((p) => p.value === draft.priority) || PRIORITY_OPTIONS[1];
    const currentStatusObj = ALL_STATUSES.find((s) => s.value === draft.status) || ALL_STATUSES[0];

    return (
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-4 space-y-6 pb-24 text-slate-800">
            {/* Gizli Dosya Yükleyici Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Navigasyon / Breadcrumb */}
            <div className="flex items-center justify-between">
                <TaskBreadcrumb
                    projectId={task.projectId}
                    projectKey={task.projectKey}
                    issueTypeIcon={task.issueTypeIcon}
                    issueKey={task.issueKey}
                />
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition cursor-pointer">
                        <Share2 size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition cursor-pointer">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Jira 12-Column Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* SOL KOLON - İÇERİK (8 Kolon) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Başlık Alanı */}
                    <div>
                        {canEditTitle ? (
                            <input
                                value={draft.title}
                                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                className="text-2xl font-bold w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1.5 focus:outline-none transition-all text-slate-900"
                                placeholder="Görev başlığı"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold px-2 py-1.5 text-slate-900">{task.title}</h1>
                        )}
                    </div>

                    {/* Jira Aksiyon Barı */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <button
                            onClick={handleAssignToMe}
                            disabled={!canReassign || draft.assigneeId === currentUser?.userId}
                            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1.5 rounded transition cursor-pointer disabled:opacity-50"
                        >
                            <UserCheck size={14} />
                            <span>Bana Ata</span>
                        </button>
                        <button
                            onClick={handleAttachClick}
                            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1.5 rounded transition cursor-pointer"
                        >
                            <Paperclip size={14} />
                            <span>Ekle</span>
                        </button>
                        <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1.5 rounded transition cursor-pointer">
                            <Plus size={14} />
                            <span>Alt Görev Ekle</span>
                        </button>
                        <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1.5 rounded transition cursor-pointer">
                            <Link2 size={14} />
                            <span>İlişkilendir</span>
                        </button>
                        {task.allowsChildren && isPM && task.status !== 'Closed' && (
                            <button
                                onClick={handleCloseEpic}
                                className="flex items-center gap-1.5 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium px-2.5 py-1.5 rounded transition cursor-pointer"
                            >
                                <CheckCircle2 size={14} />
                                <span>Epic'i Kapat</span>
                            </button>
                        )}
                    </div>
                    {closeEpicError && <p className="text-red-500 text-xs font-medium">{closeEpicError}</p>}

                    {/* Açıklama Alanı (Rich Toolbar ile) */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Açıklama</h3>
                        {canEditDescription ? (
                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-100 bg-slate-50/50 text-slate-500">
                                    <button
                                        type="button"
                                        onClick={() => insertFormat('**')}
                                        title="Kalın"
                                        className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        <Bold size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormat('*')}
                                        title="İtalik"
                                        className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        <Italic size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormat('`')}
                                        title="Kod"
                                        className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        <Code size={14} />
                                    </button>
                                    <span className="w-px h-4 bg-slate-200 mx-1" />
                                    <button
                                        type="button"
                                        onClick={() => insertFormat('\n- ')}
                                        title="Liste"
                                        className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        <List size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormat('@')}
                                        title="Etiketle"
                                        className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        <AtSign size={14} />
                                    </button>
                                </div>
                                <MentionTextarea
                                    value={draft.description}
                                    onChange={(v) => setDraft({ ...draft, description: v })}
                                    members={members}
                                    placeholder="Açıklama ekleyin... (@ ile ekip arkadaşınızı etiketleyebilirsiniz)"
                                    rows={5}
                                    className="w-full p-3 text-sm focus:outline-none bg-transparent"
                                />
                            </div>
                        ) : (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {task.description || <span className="text-slate-400 italic">Açıklama eklenmemiş.</span>}
                            </div>
                        )}
                    </div>

                    {/* Subtasks */}
                    <SubtasksSection taskId={task.id} projectId={task.projectId} />

                    {/* Checklist */}
                    <ChecklistSection taskId={task.id} />

                    {/* Activity Tabs */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivite</h3>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-medium">
                                <button
                                    onClick={() => setActiveActivityTab('comments')}
                                    className={`px-3 py-1 rounded transition cursor-pointer ${activeActivityTab === 'comments'
                                        ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Yorumlar ({task.commentCount ?? 0})
                                </button>
                                <button
                                    onClick={() => setActiveActivityTab('worklogs')}
                                    className={`px-3 py-1 rounded transition cursor-pointer ${activeActivityTab === 'worklogs'
                                        ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Çalışma Günlükleri
                                </button>
                                <button
                                    onClick={() => setActiveActivityTab('attachments')}
                                    className={`px-3 py-1 rounded transition cursor-pointer ${activeActivityTab === 'attachments'
                                        ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Ekler ({task.attachmentCount ?? 0})
                                </button>
                            </div>
                        </div>

                        <div>
                            {activeActivityTab === 'comments' && <CommentsSection taskId={task.id} projectId={task.projectId} />}
                            {activeActivityTab === 'worklogs' && <WorkLogsSection taskId={task.id} />}
                            {activeActivityTab === 'attachments' && <AttachmentsSection taskId={task.id} />}
                        </div>
                    </div>
                </div>

                {/* SAĞ KOLON - ÖZELLİKLER & ÖZET (4 Kolon) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Status Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status</label>
                        <div className="relative">
                            <select
                                value={draft.status}
                                onChange={(e) => setDraft({ ...draft, status: e.target.value as ItemStatus })}
                                className={`appearance-none w-full border font-bold text-xs px-3 py-2 rounded-md cursor-pointer transition focus:outline-none ${currentStatusObj.color}`}
                            >
                                {ALL_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value} className="bg-white text-slate-800 font-normal">
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Property List (Details) */}
                    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                        <div className="p-3 font-bold text-slate-700 uppercase tracking-wider text-[11px] bg-slate-50/50 rounded-t-lg">
                            Details
                        </div>

                        {/* Assignee */}
                        <div className="p-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-slate-500 font-medium">Assignee</span>
                            <div className="col-span-8">
                                {canReassign ? (
                                    <select
                                        value={draft.assigneeId}
                                        onChange={(e) => setDraft({ ...draft, assigneeId: e.target.value })}
                                        className="w-full bg-transparent hover:bg-slate-50 font-medium text-slate-800 border border-transparent hover:border-slate-200 rounded px-1.5 py-1 transition focus:bg-white focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="">Unassigned</option>
                                        {members?.map((m) => (
                                            <option key={m.userId} value={m.userId}>
                                                {m.userName}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 font-medium text-slate-800 px-1.5 py-1">
                                        <Avatar name={task.assigneeName ?? 'U'} />
                                        <span>{task.assigneeName ?? 'Unassigned'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="p-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-slate-500 font-medium">Priority</span>
                            <div className="col-span-8">
                                {canEditPriority ? (
                                    <select
                                        value={draft.priority}
                                        onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) as Priority })}
                                        className="w-full bg-transparent hover:bg-slate-50 font-semibold text-slate-800 border border-transparent hover:border-slate-200 rounded px-1.5 py-1 transition focus:bg-white focus:border-blue-500 cursor-pointer"
                                    >
                                        {PRIORITY_OPTIONS.map((p) => (
                                            <option key={p.value} value={p.value}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 px-1.5 py-1">
                                        {currentPriorityObj.icon}
                                        <span>{currentPriorityObj.label}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Story Points */}
                        <div className="p-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-slate-500 font-medium">Story Points</span>
                            <div className="col-span-8">
                                {canEditStoryPoint ? (
                                    <select
                                        value={draft.storyPoint}
                                        onChange={(e) => setDraft({ ...draft, storyPoint: e.target.value })}
                                        className="w-full bg-transparent hover:bg-slate-50 font-semibold text-slate-800 border border-transparent hover:border-slate-200 rounded px-1.5 py-1 transition focus:bg-white focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        {FIBONACCI.map((v) => (
                                            <option key={v} value={v}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="px-1.5 py-1">
                                        {task.storyPoint ? (
                                            <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                                                {task.storyPoint}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-medium">-</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reporter */}
                        <div className="p-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-slate-500 font-medium">Reporter</span>
                            <div className="col-span-8 flex items-center gap-2 font-medium text-slate-800 px-1.5 py-1">
                                <Avatar name={task.reporterName} />
                                <span>{task.reporterName}</span>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="p-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-slate-500 font-medium">Due Date</span>
                            <div className="col-span-8">
                                {canEditDueDate ? (
                                    <input
                                        type="date"
                                        value={draft.dueDate}
                                        onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                                        className="w-full bg-transparent hover:bg-slate-50 font-medium text-slate-800 border border-transparent hover:border-slate-200 rounded px-1.5 py-1 transition focus:bg-white focus:border-blue-500 cursor-pointer"
                                    />
                                ) : (
                                    <span className="px-1.5 py-1 font-medium text-slate-800 block">
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '-'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Release */}
                        <div className="p-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-slate-500 font-medium">Fix Version</span>
                            <div className="col-span-8">
                                {canEditRelease ? (
                                    <select
                                        value={draft.releaseId}
                                        onChange={(e) => setDraft({ ...draft, releaseId: e.target.value })}
                                        className="w-full bg-transparent hover:bg-slate-50 font-medium text-slate-800 border border-transparent hover:border-slate-200 rounded px-1.5 py-1 transition focus:bg-white focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="">Unreleased</option>
                                        {releases?.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.version}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="px-1.5 py-1">
                                        {task.releaseVersion ? (
                                            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                                                {task.releaseVersion}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-medium">-</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Watchers */}
                        <div className="p-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-slate-500 font-medium">Watchers</span>
                            <div className="col-span-8 px-1.5 py-1">
                                <WatchersSection taskId={task.id} watcherCount={task.watcherCount} />
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="p-3 grid grid-cols-12 items-start gap-2">
                            <span className="col-span-4 text-slate-500 font-medium pt-1">Labels</span>
                            <div className="col-span-8">
                                <LabelsSection taskId={task.id} currentLabels={task.labels} />
                            </div>
                        </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="text-[11px] text-slate-400 space-y-1 px-1">
                        <p>Oluşturulma: {new Date(task.createdAt).toLocaleDateString('tr-TR')}</p>
                        <p>Son Güncelleme: {new Date(task.updatedAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>
            </div>

            {/* Jira Unsaved Changes Floating Bar */}
            {isDirty && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-300 shadow-xl rounded-lg px-6 py-3 flex items-center gap-6 z-50 text-xs animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center gap-2 text-amber-800 font-medium">
                        <AlertCircle size={16} className="text-amber-600 shrink-0" />
                        <span>Kaydedilmemiş değişiklikleriniz var.</span>
                    </div>
                    {saveError && <span className="text-red-600 font-semibold">{saveError}</span>}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-amber-100 rounded transition font-medium cursor-pointer"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded transition shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Basit Avatar Bileşeni
function Avatar({ name }: { name: string }) {
    const initials = name
        ? name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
        : 'U';

    return (
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
            {initials}
        </div>
    );
}

// Skeleton Yüklenme Ekranı
function TaskDetailSkeleton() {
    return (
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 space-y-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="h-8 bg-slate-200 rounded w-3/4" />
                    <div className="h-8 bg-slate-100 rounded w-full" />
                    <div className="h-32 bg-slate-100 rounded w-full" />
                </div>
                <div className="lg:col-span-4 space-y-4">
                    <div className="h-10 bg-slate-200 rounded w-full" />
                    <div className="h-64 bg-slate-100 rounded w-full" />
                </div>
            </div>
        </div>
    );
}

function PRIORITY_NAME_TO_NUM(name: string): Priority {
    const map: Record<string, Priority> = { Low: 0, Medium: 1, High: 2, Critical: 3 };
    return map[name] ?? 1;
}

const STATUS_TO_INT: Record<ItemStatus, number> = {
    ToDo: 0,
    InProgress: 1,
    ReadyForReview: 2,
    ReadyForQA: 3,
    Done: 4,
    Closed: 5,
};