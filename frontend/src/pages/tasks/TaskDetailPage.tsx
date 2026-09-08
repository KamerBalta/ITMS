import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { CustomFieldsSection } from './sections/CustomFieldsSection';
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
import { useResolveIssueKey } from '../../hooks/useTasks';
import { useReleases } from '../../hooks/useReleases';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useWorkflowStatuses } from '../../hooks/useWorkflow';
import type { Priority } from '../../types/task';
import { CommentsSection } from './sections/CommentsSection';
import { AttachmentsSection } from './sections/AttachmentsSection';
import { ChecklistSection } from './sections/ChecklistSection';
import { WatchersSection } from './sections/WatchersSection';
import { WorkLogsSection } from './sections/WorkLogsSection';
import { LabelsSection } from './sections/LabelsSection';
import { ComponentsSection } from './sections/ComponentsSection';
import { TaskLinksSection } from './sections/TaskLinksSection';
import { GitActivitySection } from './sections/GitActivitySection';
import { PipelineRunsSection } from './sections/PipelineRunsSection';
import { SubtasksSection, type SubtasksSectionHandle } from './sections/SubtasksSection';
import { HistorySection } from './sections/HistorySection';
import { TaskBreadcrumb } from '../../components/TaskBreadcrumb';
import { RichTextEditor } from '../../components/RichTextEditor';
import { MarkdownContent } from '../../components/MarkdownContent';
import { TimeTrackingWidget } from '../../components/TimeTrackingWidget';
import {
    CheckCircle2,
    Paperclip,
    UserCheck,
    ArrowUp,
    ArrowDown,
    Minus,
    AlertOctagon,
    Link2,
    Share2,
    MoreHorizontal,
    AlertCircle,
    CheckSquare,
} from 'lucide-react';

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
    status: string;
    assigneeId: string;
    releaseId: string;
}

export function TaskDetailPage() {
    const { issueKey } = useParams<{ issueKey: string }>();
    const { data: resolvedTaskId, isLoading: isResolving, isError: isResolveError } = useResolveIssueKey(issueKey ?? null);
    const { data: task, isLoading: isTaskLoading, isError: isTaskError } = useTaskDetail(resolvedTaskId ?? null);
    const { data: members, isLoading: isMembersLoading } = useProjectMembers(task?.projectId ?? null);

    if (isResolveError || isTaskError) {
        return (
            <div className="text-center py-16">
                <p className="text-muted">
                    {isResolveError
                        ? `"${issueKey}" anahtarına sahip bir görev bulunamadı.`
                        : 'Bu görev bulunamadı veya erişim yetkiniz yok.'}
                </p>
                <Link to="/dashboard" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
                    ← Dashboard'a dön
                </Link>
            </div>
        );
    }

    if (isResolving || isTaskLoading || isMembersLoading || !task || !members) {
        return <TaskDetailSkeleton />;
    }

    return (
        <TaskDetailContent
            key={`${task.id}-${task.updatedAt ?? task.createdAt}-${task.statusId}-${members.length}`}
            task={task}
            members={members}
        />
    );
}

type TaskDetailData = NonNullable<ReturnType<typeof useTaskDetail>['data']>;
type ProjectMemberData = NonNullable<ReturnType<typeof useProjectMembers>['data']>[number];

function TaskDetailContent({ task, members }: { task: TaskDetailData; members: ProjectMemberData[] }) {
    const currentUser = useAuthStore((state) => state.user);

    const updateStatus = useUpdateTaskStatus(task.projectId);
    const updateTitle = useUpdateTaskTitle(task.id);
    const updateDescription = useUpdateTaskDescription(task.id);
    const updatePriority = useUpdateTaskPriority(task.id);
    const updateStoryPoint = useUpdateTaskStoryPoint(task.id);
    const updateDueDate = useUpdateTaskDueDate(task.id);
    const updateRelease = useUpdateTaskRelease(task.id);
    const reassign = useReassignTaskDetail(task.id, task.projectId);
    const closeEpic = useCloseEpic(task.id, task.projectId);
    const uploadAttachment = useUploadAttachment(task.id);

    const { data: releases } = useReleases(task.projectId);
    const { data: workflowStatuses, isLoading: statusesLoading } = useWorkflowStatuses(task.projectId ?? null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const taskLinksRef = useRef<HTMLDivElement>(null);
    const subtasksSectionRef = useRef<SubtasksSectionHandle>(null);
    const subtasksContainerRef = useRef<HTMLDivElement>(null);

    const originalAssigneeId =
        members.find((m) => m.userName === task.assigneeName)?.userId ?? '';

    const [draft, setDraft] = useState<Draft>(() => ({
        title: task.title,
        description: task.description ?? '',
        priority: PRIORITY_NAME_TO_NUM(task.priority),
        storyPoint: task.storyPoint?.toString() ?? '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        status: task.statusId,
        assigneeId: originalAssigneeId,
        releaseId: task.releaseId ?? '',
    }));

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [concurrencyConflict, setConcurrencyConflict] = useState(false);
    const [closeEpicError, setCloseEpicError] = useState<string | null>(null);
    const [activeActivityTab, setActiveActivityTab] = useState<'comments' | 'worklogs' | 'attachments'>('comments');

    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const isDeveloper = currentUser?.roles.includes('Developer') ?? false;
    const isAssignee =
        task.assigneeName !== null && members.some((m) => m.userName === task.assigneeName && m.userId === currentUser?.userId);

    const canEditTitle = isPM;
    const canEditDescription = isPM || isAssignee;
    const canEditPriority = isPM;
    const canEditStoryPoint = isPM || (isAssignee && isDeveloper);
    const canEditDueDate = isPM;
    const canReassign = isPM;
    const canEditRelease = isPM;

    const canAddSubtask = Boolean(task.allowsChildren && !task.requiresParent);

    const isDirty =
        draft.title !== task.title ||
        draft.description !== (task.description ?? '') ||
        draft.priority !== PRIORITY_NAME_TO_NUM(task.priority) ||
        draft.storyPoint !== (task.storyPoint?.toString() ?? '') ||
        draft.dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : '') ||
        draft.status !== task.statusId ||
        draft.assigneeId !== originalAssigneeId ||
        draft.releaseId !== (task.releaseId ?? '');

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleScrollToLinks = () => {
        taskLinksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleAddSubtaskClick = () => {
        subtasksContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        subtasksSectionRef.current?.openAddForm();
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

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
        } catch {
            // Clipboard desteklenmiyorsa sessizce geç
        }
    };

    const handleCancel = () => {
        setDraft({
            title: task.title,
            description: task.description ?? '',
            priority: PRIORITY_NAME_TO_NUM(task.priority),
            storyPoint: task.storyPoint?.toString() ?? '',
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
            status: task.statusId,
            assigneeId: originalAssigneeId,
            releaseId: task.releaseId ?? '',
        });
        setSaveError(null);
        setConcurrencyConflict(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        setConcurrencyConflict(false);

        const jobs: { label: string; promise: Promise<unknown> }[] = [];

        if (canEditTitle && draft.title !== task.title)
            jobs.push({ label: 'Başlık', promise: updateTitle.mutateAsync(draft.title) });
        if (canEditDescription && draft.description !== (task.description ?? ''))
            jobs.push({ label: 'Açıklama', promise: updateDescription.mutateAsync(draft.description) });
        if (canEditPriority && draft.priority !== PRIORITY_NAME_TO_NUM(task.priority))
            jobs.push({ label: 'Öncelik', promise: updatePriority.mutateAsync(draft.priority) });
        if (canEditStoryPoint && draft.storyPoint !== (task.storyPoint?.toString() ?? ''))
            jobs.push({ label: 'Story Point', promise: updateStoryPoint.mutateAsync(draft.storyPoint ? Number(draft.storyPoint) : null) });
        if (canEditDueDate && draft.dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : ''))
            jobs.push({ label: 'Teslim Tarihi', promise: updateDueDate.mutateAsync(draft.dueDate || null) });
        if (draft.status && draft.status !== task.statusId) {
            jobs.push({
                label: 'Durum',
                promise: updateStatus.mutateAsync({
                    taskId: task.id,
                    status: draft.status,
                }),
            });
        }
        if (canReassign && draft.assigneeId !== originalAssigneeId)
            jobs.push({ label: 'Atanan Kişi', promise: reassign.mutateAsync(draft.assigneeId || null) });
        if (canEditRelease && draft.releaseId !== (task.releaseId ?? ''))
            jobs.push({ label: 'Release', promise: updateRelease.mutateAsync(draft.releaseId || null) });

        const results = await Promise.allSettled(jobs.map((j) => j.promise));
        setIsSaving(false);

        const failures = results
            .map((r, i) => ({ result: r, label: jobs[i].label }))
            .filter((x) => x.result.status === 'rejected');

        if (failures.length > 0) {
            const concurrencyFailure = failures.find((f) => {
                const rejected = f.result as PromiseRejectedResult;
                const axiosError = rejected.reason as AxiosError<ApiErrorResponse>;
                return axiosError.response?.status === 409;
            });

            if (concurrencyFailure) {
                setConcurrencyConflict(true);
            }

            const details = failures
                .map((f) => {
                    const rejected = f.result as PromiseRejectedResult;
                    const axiosError = rejected.reason as AxiosError<ApiErrorResponse>;
                    const msg = axiosError.response?.data?.message ?? 'bilinmeyen hata';
                    return `${f.label}: ${msg}`;
                })
                .join(' · ');
            setSaveError(details);
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
        setDraft((prev) => ({ ...prev, assigneeId: currentUser.userId }));
    };

    const currentPriorityObj = PRIORITY_OPTIONS.find((p) => p.value === draft.priority) || PRIORITY_OPTIONS[1];

    return (
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-4 space-y-6 pb-24 text-primary">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            <div className="flex items-center justify-between">
                <TaskBreadcrumb
                    projectId={task.projectId}
                    projectKey={task.projectKey}
                    issueTypeIcon={task.issueTypeIcon}
                    issueKey={task.issueKey}
                />
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        title="Copy link"
                        className="p-1.5 hover-surface rounded-md text-secondary transition cursor-pointer"
                    >
                        <Share2 size={16} />
                    </button>
                    <button type="button" className="p-1.5 hover-surface rounded-md text-secondary transition cursor-pointer">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-xs font-semibold text-secondary">
                                {task.issueKey}
                            </span>
                            <span className="text-xs text-muted">•</span>
                            <span className="text-xs text-muted">
                                {task.issueType}
                            </span>
                        </div>

                        {canEditTitle ? (
                            <input
                                value={draft.title}
                                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                className="
                                    text-2xl font-semibold text-primary
                                    w-full bg-transparent
                                    border border-transparent
                                    hover:border-gray-300 dark:hover:border-gray-600
                                    focus:border-blue-500
                                    focus:bg-white dark:focus:bg-gray-800
                                    rounded-md
                                    px-2 py-1.5
                                    focus:outline-none
                                    transition-all
                                "
                                placeholder="Görev başlığı"
                            />
                        ) : (
                            <h1 className="text-2xl font-semibold text-primary px-2 py-1.5">{task.title}</h1>
                        )}
                    </div>

                    <div className="px-2">
                        <select
                            value={draft.status}
                            onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                            disabled={statusesLoading || !workflowStatuses}
                            className="input-base border rounded px-2 py-1 text-sm mt-1 w-full bg-transparent font-medium cursor-pointer disabled:opacity-50"
                        >
                            {!workflowStatuses || workflowStatuses.length === 0 ? (
                                <option value={draft.status}>Yükleniyor...</option>
                            ) : (
                                [...workflowStatuses]
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((s) => (
                                        <option key={s.id} value={s.id} className="surface text-primary font-normal">
                                            {s.name}
                                        </option>
                                    ))
                            )}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs px-2">
                        <button
                            type="button"
                            onClick={handleAssignToMe}
                            disabled={!canReassign || draft.assigneeId === currentUser?.userId}
                            className="
                                inline-flex items-center gap-1.5
                                surface hover-surface
                                text-secondary
                                font-medium
                                px-2.5 py-1.5
                                rounded-md
                                transition
                                cursor-pointer
                                border border-gray-200
                                dark:border-gray-700
                                disabled:opacity-50
                            "
                        >
                            <UserCheck size={14} />
                            <span>Bana Ata</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleAttachClick}
                            className="
                                inline-flex items-center gap-1.5
                                surface hover-surface
                                text-secondary
                                font-medium
                                px-2.5 py-1.5
                                rounded-md
                                transition
                                cursor-pointer
                                border border-gray-200
                                dark:border-gray-700
                            "
                        >
                            <Paperclip size={14} />
                            <span>Ekle</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleScrollToLinks}
                            className="
                                inline-flex items-center gap-1.5
                                surface hover-surface
                                text-secondary
                                font-medium
                                px-2.5 py-1.5
                                rounded-md
                                transition
                                cursor-pointer
                                border border-gray-200
                                dark:border-gray-700
                            "
                        >
                            <Link2 size={14} />
                            <span>İlişkilendir</span>
                        </button>

                        {canAddSubtask && (
                            <button
                                type="button"
                                onClick={handleAddSubtaskClick}
                                className="
                                    inline-flex items-center gap-1.5
                                    surface hover-surface
                                    text-secondary
                                    font-medium
                                    px-2.5 py-1.5
                                    rounded-md
                                    transition
                                    cursor-pointer
                                    border border-gray-200
                                    dark:border-gray-700
                                "
                            >
                                <CheckSquare size={14} className="text-sky-600 dark:text-sky-400" />
                                <span>Alt Görev Ekle</span>
                            </button>
                        )}

                        {task.allowsChildren && isPM && task.status !== 'Closed' && (
                            <button
                                type="button"
                                onClick={handleCloseEpic}
                                className="
                                    inline-flex items-center gap-1.5
                                    border border-indigo-200 dark:border-indigo-800
                                    bg-indigo-50 dark:bg-indigo-950
                                    text-indigo-700 dark:text-indigo-300
                                    hover:bg-indigo-100 dark:hover:bg-indigo-900
                                    font-medium
                                    px-2.5 py-1.5
                                    rounded-md
                                    transition
                                    cursor-pointer
                                "
                            >
                                <CheckCircle2 size={14} />
                                <span>Epic'i Kapat</span>
                            </button>
                        )}
                    </div>
                    {closeEpicError && <p className="text-red-500 dark:text-red-400 text-xs font-medium px-2">{closeEpicError}</p>}

                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Açıklama</h3>
                        {canEditDescription ? (
                            <RichTextEditor
                                value={draft.description}
                                onChange={(v) => setDraft({ ...draft, description: v })}
                                members={members}
                                placeholder="Açıklama ekleyin... (@ ile etiketleme, Markdown biçimlendirme desteklenir)"
                                rows={5}
                            />
                        ) : task.description ? (
                            <div className="text-secondary">
                                <MarkdownContent content={task.description} />
                            </div>
                        ) : (
                            <p className="text-muted">Açıklama yok.</p>
                        )}
                    </div>

                    <CustomFieldsSection taskId={task.id} projectId={task.projectId} />

                    <div ref={taskLinksRef} className="scroll-mt-6">
                        <TaskLinksSection taskId={task.id} projectId={task.projectId} />
                    </div>

                    <GitActivitySection taskId={task.id} issueKey={task.issueKey} />
                    <PipelineRunsSection taskId={task.id} />

                    <div ref={subtasksContainerRef} className="scroll-mt-6">
                        <SubtasksSection
                            ref={subtasksSectionRef}
                            taskId={task.id}
                            projectId={task.projectId}
                            canAdd={canAddSubtask}
                        />
                    </div>

                    <ChecklistSection taskId={task.id} />

                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <h3 className="text-sm font-semibold text-primary">Activity</h3>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveActivityTab('comments')}
                                    className={`
                                        px-1 py-2
                                        text-xs
                                        font-medium
                                        border-b-2
                                        transition
                                        cursor-pointer
                                        ${activeActivityTab === 'comments'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-secondary hover:text-primary'
                                        }
                                    `}
                                >
                                    Yorumlar ({task.commentCount ?? 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveActivityTab('worklogs')}
                                    className={`
                                        px-1 py-2
                                        text-xs
                                        font-medium
                                        border-b-2
                                        transition
                                        cursor-pointer
                                        ${activeActivityTab === 'worklogs'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-secondary hover:text-primary'
                                        }
                                    `}
                                >
                                    Çalışma Günlükleri
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveActivityTab('attachments')}
                                    className={`
                                        px-1 py-2
                                        text-xs
                                        font-medium
                                        border-b-2
                                        transition
                                        cursor-pointer
                                        ${activeActivityTab === 'attachments'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-secondary hover:text-primary'
                                        }
                                    `}
                                >
                                    Ekler ({task.attachmentCount ?? 0})
                                </button>
                            </div>
                        </div>

                        <div>
                            {activeActivityTab === 'comments' && <CommentsSection taskId={task.id} projectId={task.projectId} />}
                            {activeActivityTab === 'worklogs' && (
                                <div className="space-y-4">
                                    <TimeTrackingWidget
                                        taskId={task.id}
                                        originalEstimateMinutes={task.originalEstimateMinutes}
                                        remainingEstimateMinutes={task.remainingEstimateMinutes}
                                        canEdit={isPM || isAssignee}
                                    />
                                    <WorkLogsSection taskId={task.id} />
                                </div>
                            )}
                            {activeActivityTab === 'attachments' && <AttachmentsSection taskId={task.id} />}
                        </div>
                    </div>

                    <HistorySection taskId={task.id} />
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="
                        surface
                        border
                        border-gray-200
                        dark:border-gray-700
                        rounded-md
                        p-4
                        divide-y
                        divide-gray-100
                        dark:divide-gray-800
                        text-xs
                    ">
                        <div className="
                            px-3 py-2
                            -mx-4 -mt-4 mb-1
                            text-xs
                            font-semibold
                            text-primary
                            border-b
                            border-gray-200
                            dark:border-gray-700
                        ">
                            Details
                        </div>

                        <div className="py-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-muted font-medium">Assignee</span>
                            <div className="col-span-8">
                                {canReassign ? (
                                    <select
                                        value={draft.assigneeId}
                                        onChange={(e) => setDraft({ ...draft, assigneeId: e.target.value })}
                                        className="w-full bg-transparent hover-surface font-medium text-primary input-base border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded px-1.5 py-1 transition focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="">Unassigned</option>
                                        {members.map((m) => (
                                            <option key={m.userId} value={m.userId}>
                                                {m.userName}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 font-medium text-primary px-1.5 py-1">
                                        <Avatar name={task.assigneeName ?? 'U'} />
                                        <span>{task.assigneeName ?? 'Unassigned'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="py-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-muted font-medium">Priority</span>
                            <div className="col-span-8">
                                {canEditPriority ? (
                                    <select
                                        value={draft.priority}
                                        onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) as Priority })}
                                        className="w-full bg-transparent hover-surface font-semibold text-primary input-base border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded px-1.5 py-1 transition focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 cursor-pointer"
                                    >
                                        {PRIORITY_OPTIONS.map((p) => (
                                            <option key={p.value} value={p.value}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 font-semibold text-primary px-1.5 py-1">
                                        {currentPriorityObj.icon}
                                        <span>{currentPriorityObj.label}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="py-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-muted font-medium">Story Points</span>
                            <div className="col-span-8">
                                {canEditStoryPoint ? (
                                    <select
                                        value={draft.storyPoint}
                                        onChange={(e) => setDraft({ ...draft, storyPoint: e.target.value })}
                                        className="w-full bg-transparent hover-surface font-semibold text-primary input-base border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded px-1.5 py-1 transition focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 cursor-pointer"
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
                                            <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-bold bg-gray-100 dark:bg-gray-700 text-secondary rounded-full border border-gray-200 dark:border-gray-600">
                                                {task.storyPoint}
                                            </span>
                                        ) : (
                                            <span className="text-muted font-medium">-</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="py-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-muted font-medium">Reporter</span>
                            <div className="col-span-8 flex items-center gap-2 font-medium text-primary px-1.5 py-1">
                                <Avatar name={task.reporterName} />
                                <span>{task.reporterName}</span>
                            </div>
                        </div>

                        <div className="py-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-muted font-medium">Due Date</span>
                            <div className="col-span-8">
                                {canEditDueDate ? (
                                    <input
                                        type="date"
                                        value={draft.dueDate}
                                        onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                                        className="w-full bg-transparent hover-surface font-medium text-primary input-base border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded px-1.5 py-1 transition focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 cursor-pointer"
                                    />
                                ) : (
                                    <span className="px-1.5 py-1 font-medium text-primary block">
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '-'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="py-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-muted font-medium">Fix Version</span>
                            <div className="col-span-8">
                                {canEditRelease ? (
                                    <select
                                        value={draft.releaseId}
                                        onChange={(e) => setDraft({ ...draft, releaseId: e.target.value })}
                                        className="w-full bg-transparent hover-surface font-medium text-primary input-base border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded px-1.5 py-1 transition focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 cursor-pointer"
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
                                            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded">
                                                {task.releaseVersion}
                                            </span>
                                        ) : (
                                            <span className="text-muted font-medium">-</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="py-3 grid grid-cols-12 items-center gap-2">
                            <span className="col-span-4 text-muted font-medium">Watchers</span>
                            <div className="col-span-8 px-1.5 py-1">
                                <WatchersSection taskId={task.id} watcherCount={task.watcherCount} />
                            </div>
                        </div>

                        <div className="py-3 grid grid-cols-12 items-start gap-2">
                            <span className="col-span-4 text-muted font-medium pt-1">Labels</span>
                            <div className="col-span-8">
                                <LabelsSection taskId={task.id} currentLabels={task.labels} />
                            </div>
                        </div>

                        <div className="py-3 grid grid-cols-12 items-start gap-2">
                            <span className="col-span-4 text-muted font-medium pt-1">Components</span>
                            <div className="col-span-8">
                                <ComponentsSection taskId={task.id} projectId={task.projectId} currentComponents={task.components} />
                            </div>
                        </div>
                    </div>

                    <div className="text-[11px] text-muted space-y-1 px-1">
                        <p>Oluşturulma: {new Date(task.createdAt).toLocaleDateString('tr-TR')}</p>
                        <p>Son Güncelleme: {new Date(task.updatedAt ?? task.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>
            </div>

            {isDirty && (
                <div className="
                    fixed
                    bottom-4
                    left-1/2
                    -translate-x-1/2
                    bg-white
                    dark:bg-gray-900
                    border
                    border-gray-300
                    dark:border-gray-700
                    shadow-xl
                    rounded-md
                    px-5 py-3
                    flex
                    flex-col
                    gap-3
                    z-50
                    text-xs
                    animate-in
                    slide-in-from-bottom
                    duration-200
                    max-w-2xl
                    w-[calc(100%-2rem)]
                ">
                    {concurrencyConflict && (
                        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded px-3 py-2 flex items-center justify-between">
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                Bu görev siz düzenlerken başka biri tarafından değiştirildi.
                            </p>
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 whitespace-nowrap ml-3 cursor-pointer"
                            >
                                Sayfayı Yenile
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-5 flex-wrap">
                        <div className="flex items-center gap-2 text-secondary font-medium">
                            <AlertCircle size={16} className="text-amber-500 shrink-0" />
                            <span>Kaydedilmemiş değişiklikleriniz var.</span>
                        </div>

                        {saveError && <span className="text-red-600 dark:text-red-400 font-semibold">{saveError}</span>}

                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-3 py-1.5 text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition font-medium cursor-pointer"
                            >
                                İptal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="
                                    bg-blue-600
                                    hover:bg-blue-700
                                    text-white
                                    font-semibold
                                    px-4 py-1.5
                                    rounded-md
                                    transition
                                    disabled:opacity-50
                                    cursor-pointer
                                "
                            >
                                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

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

function TaskDetailSkeleton() {
    return (
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 space-y-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                </div>
                <div className="lg:col-span-4 space-y-4">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                </div>
            </div>
        </div>
    );
}

function PRIORITY_NAME_TO_NUM(name: string): Priority {
    const map: Record<string, Priority> = { Low: 0, Medium: 1, High: 2, Critical: 3 };
    return map[name] ?? 1;
}