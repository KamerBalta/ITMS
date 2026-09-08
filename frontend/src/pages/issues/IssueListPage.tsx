import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useTasks } from '../../hooks/useTasks';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useProjectIssueTypes } from '../../hooks/useProjectIssueTypes';
import { useWorkflowStatuses } from '../../hooks/useWorkflow';
import { useSprints } from '../../hooks/useSprints';
import { useAllLabels } from '../../hooks/useTaskDetail';
import { useComponents } from '../../hooks/useComponents';
import {
    useBulkUpdateStatus,
    useBulkReassign,
    useBulkMoveToSprint,
    useBulkAddLabel,
    useBulkDelete,
} from '../../hooks/useBulkTaskActions';
import {
    useIssueListSavedFilters,
    useCreateIssueListSavedFilter,
} from '../../hooks/useIssueListSavedFilters';
import { serializeCriteria, deserializeCriteria } from '../../types/savedFilter';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePagination } from '../../hooks/usePagination';
import { PaginationBar } from '../../components/PaginationBar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { taskDetailUrl } from '../../lib/taskUrl';
import { AddFilterMenu } from '../../components/AddFilterMenu';
import { FilterCriterionChip } from '../../components/FilterCriterionChip';
import { resolveFilterCriteria } from '../../lib/resolveFilterCriteria';
import type { ActiveFilterCriterion, FilterField } from '../../types/filterCriteria';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { Search, Share2, Bookmark, Check, X } from 'lucide-react';

let chipIdCounter = 0;
const nextChipId = () => `chip-${++chipIdCounter}`;

export function IssueListPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const currentUser = useAuthStore((state) => state.user);
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('q') ?? '');
    const filterId = searchParams.get('filterId');
    const debouncedSearch = useDebouncedValue(search, 350);

    // Taslak ve Gerçek Kriterler
    const [draftCriteria, setDraftCriteria] = useState<ActiveFilterCriterion[]>([]);
    const [appliedCriteria, setAppliedCriteria] = useState<ActiveFilterCriterion[]>([]);

    // Filtre Kaydetme State'leri
    const [isSaving, setIsSaving] = useState(false);
    const [saveFilterName, setSaveFilterName] = useState('');
    const [saveAsShared, setSaveAsShared] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const { page, setPage, pageSize, reset: resetPagination } = usePagination(25);

    const { data: issueTypes } = useProjectIssueTypes(selectedProjectId);
    const { data: workflowStatuses } = useWorkflowStatuses(selectedProjectId);
    const { data: members } = useProjectMembers(selectedProjectId);
    const { data: sprints } = useSprints(selectedProjectId);
    const { data: allLabels } = useAllLabels();
    const { data: components } = useComponents(selectedProjectId);
    const { data: savedFilters } = useIssueListSavedFilters(selectedProjectId);
    const createSavedFilter = useCreateIssueListSavedFilter(selectedProjectId ?? '');

    // React "Adjusting state during rendering" kuralına uygun resetleme
    const [prevProjectId, setPrevProjectId] = useState(selectedProjectId);
    if (selectedProjectId !== prevProjectId) {
        setPrevProjectId(selectedProjectId);
        setSearch('');
        setDraftCriteria([]);
        setAppliedCriteria([]);
        resetPagination();
    }

    // URL'deki filterId değiştiğinde render sırasında state senkronizasyonu
    const [prevFilterId, setPrevFilterId] = useState(filterId);
    if (filterId !== prevFilterId) {
        setPrevFilterId(filterId);
        if (filterId && savedFilters) {
            const filter = savedFilters.find((f) => f.id === filterId);
            if (filter) {
                const criteria = deserializeCriteria(filter.filtersJson);
                setDraftCriteria(criteria);
                setAppliedCriteria(criteria);
            }
        } else if (!filterId) {
            setDraftCriteria([]);
            setAppliedCriteria([]);
        }
    }

    const sortedWorkflowStatuses = [...(workflowStatuses ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

    const fieldOptions = {
        status: sortedWorkflowStatuses.map((s) => ({
            value: s.name,
            label: s.name,
        })),
        assignee: [
            { value: 'unassigned', label: 'Atanmamış' },
            ...(members ?? []).map((m) => ({ value: m.userId, label: m.userName })),
        ],
        reporter: (members ?? []).map((m) => ({ value: m.userId, label: m.userName })),
        issueType: (issueTypes ?? []).map((t) => ({ value: t.issueTypeId, label: t.name })),
        sprint: [
            { value: 'backlog', label: 'Backlog' },
            ...(sprints ?? [])
                .filter((s) => s.status === 'Active')
                .map((s) => ({ value: s.id, label: s.name })),
        ],
        label: (allLabels ?? []).map((l) => ({ value: l.id, label: l.name })),
        component: (components ?? []).map((c) => ({ value: c.id, label: c.name })),
    };

    const resolvedQuery = resolveFilterCriteria(appliedCriteria);

    const { data: tasks, isLoading } = useTasks(selectedProjectId, {
        search: debouncedSearch || undefined,
        ...resolvedQuery,
        page,
        pageSize,
    });

    const bulkUpdateStatus = useBulkUpdateStatus(selectedProjectId ?? '');
    const bulkReassign = useBulkReassign(selectedProjectId ?? '');
    const bulkMoveToSprint = useBulkMoveToSprint(selectedProjectId ?? '');
    const bulkAddLabel = useBulkAddLabel(selectedProjectId ?? '');
    const bulkDelete = useBulkDelete(selectedProjectId ?? '');
    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkMessage, setBulkMessage] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    // Filtreler veya arama değiştiğinde sayfayı 1'e al
    useEffect(() => {
        resetPagination();
    }, [appliedCriteria, debouncedSearch, resetPagination]);

    if (!selectedProjectId) {
        return <p className="p-5 text-xs text-gray-500 dark:text-gray-400">Devam etmek için üstten bir proje seçin.</p>;
    }

    const handleAddField = (field: FilterField) => {
        setDraftCriteria((prev) => [...prev, { id: nextChipId(), field, value: '', label: '' }]);
    };

    const handleChipChange = (id: string, value: string, label: string) => {
        setDraftCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, value, label } : c)));
    };

    const handleChipRemove = (id: string) => {
        setDraftCriteria((prev) => prev.filter((c) => c.id !== id));
    };

    const handleApplyFilters = () => {
        setAppliedCriteria(draftCriteria.filter((c) => c.value));

        if (filterId) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('filterId');
            setSearchParams(nextParams);
        }
    };

    const handleClearFilters = () => {
        setDraftCriteria([]);
        setAppliedCriteria([]);

        if (filterId) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('filterId');
            setSearchParams(nextParams);
        }
    };

    const handleSaveFilter = async () => {
        if (!saveFilterName.trim()) return;
        setSaveError(null);
        try {
            await createSavedFilter.mutateAsync({
                name: saveFilterName.trim(),
                filtersJson: serializeCriteria(appliedCriteria),
                isShared: saveAsShared,
            });
            setIsSaving(false);
            setSaveFilterName('');
            setSaveAsShared(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setSaveError(axiosError.response?.data?.message ?? 'Kaydedilemedi.');
        }
    };

    const allSelected = Boolean(tasks && tasks.length > 0 && selectedIds.size === tasks.length);
    const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(tasks?.map((t) => t.id) ?? []));
    const toggleOne = (id: string) =>
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const handleBulkStatus = async (statusId: string) => {
        if (selectedIds.size === 0 || !statusId) return;
        setBulkMessage(null);
        const result = await bulkUpdateStatus.mutateAsync({ taskIds: Array.from(selectedIds), statusId });
        setBulkMessage(`${result.successCount} görev güncellendi${result.failCount > 0 ? `, ${result.failCount} tanesi başarısız oldu` : ''}.`);
        setSelectedIds(new Set());
    };

    const handleBulkReassign = async (userId: string) => {
        if (selectedIds.size === 0) return;
        setBulkMessage(null);
        const result = await bulkReassign.mutateAsync({ taskIds: Array.from(selectedIds), assigneeId: userId || null });
        setBulkMessage(`${result.successCount} görev atandı${result.failCount > 0 ? `, ${result.failCount} tanesi başarısız oldu` : ''}.`);
        setSelectedIds(new Set());
    };

    const handleBulkMoveToSprint = async (sprintId: string) => {
        if (selectedIds.size === 0) return;
        setBulkMessage(null);
        const result = await bulkMoveToSprint.mutateAsync({ taskIds: Array.from(selectedIds), sprintId: sprintId || null });
        setBulkMessage(`${result.successCount} görev taşındı${result.failCount > 0 ? `, ${result.failCount} tanesi başarısız oldu` : ''}.`);
        setSelectedIds(new Set());
    };

    const handleBulkAddLabel = async (labelId: string) => {
        if (selectedIds.size === 0 || !labelId) return;
        setBulkMessage(null);
        const result = await bulkAddLabel.mutateAsync({ taskIds: Array.from(selectedIds), labelId });
        setBulkMessage(`${result.successCount} göreve etiket eklendi.`);
        setSelectedIds(new Set());
    };

    const handleBulkDelete = async () => {
        const ok = await confirm('Toplu Sil', `${selectedIds.size} görevi silmek istediğinize emin misiniz? Bu işlem geri alınabilir (arşivlenir).`, true);
        if (!ok) return;
        setBulkMessage(null);
        const result = await bulkDelete.mutateAsync(Array.from(selectedIds));
        setBulkMessage(`${result.successCount} görev silindi.`);
        setSelectedIds(new Set());
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-[#f7f8fa] dark:bg-gray-950">
            {/* Sayfa Başlığı */}
            <div className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <h1 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                                Issue Listesi
                            </h1>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                Issues
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                            Projedeki görevleri görüntüle, filtrele ve toplu olarak yönet.
                        </p>
                    </div>

                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                    >
                        {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
                        <span>{copiedLink ? 'Görünüm Kopyalandı' : 'Görünümü Paylaş'}</span>
                    </button>
                </div>
            </div>

            {/* Jira Tarzı Filtre Toolbar */}
            <div className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 px-4 sm:px-5 py-2.5 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] sm:min-w-[240px] max-w-xs">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Issue ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-base w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {draftCriteria.map((c) => (
                            <FilterCriterionChip
                                key={c.id}
                                criterion={c}
                                options={fieldOptions}
                                onChange={handleChipChange}
                                onRemove={handleChipRemove}
                            />
                        ))}
                        <AddFilterMenu onSelectField={handleAddField} />
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                        <button
                            onClick={handleApplyFilters}
                            className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Filtrele
                        </button>
                        {(draftCriteria.length > 0 || appliedCriteria.length > 0) && (
                            <button
                                onClick={handleClearFilters}
                                className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Temizle
                            </button>
                        )}
                        {appliedCriteria.length > 0 && !isSaving && (
                            <button
                                onClick={() => setIsSaving(true)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 ml-1 cursor-pointer"
                            >
                                <Bookmark size={13} />
                                <span>Kaydet</span>
                            </button>
                        )}
                    </div>
                </div>

                {isSaving && (
                    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-800/60 animate-in fade-in duration-200">
                        <input
                            type="text"
                            placeholder="Filtre Adı (örn. Backend Critical Tasks)"
                            value={saveFilterName}
                            onChange={(e) => setSaveFilterName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
                            className="input-base flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap cursor-pointer">
                            <input
                                type="checkbox"
                                checked={saveAsShared}
                                onChange={(e) => setSaveAsShared(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                            Paylaş
                        </label>
                        <button
                            onClick={handleSaveFilter}
                            className="cursor-pointer rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 whitespace-nowrap"
                        >
                            Kaydet
                        </button>
                        <button
                            onClick={() => { setIsSaving(false); setSaveError(null); }}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                {saveError && <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>}
            </div>

            {/* Toplu İşlem Toolbar */}
            {isPM && selectedIds.size > 0 && (
                <div className="mx-4 sm:mx-5 mt-3 shrink-0">
                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/30">
                        <span className="mr-1 text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                            {selectedIds.size} seçildi
                        </span>

                        <select
                            onChange={(e) => e.target.value && handleBulkStatus(e.target.value)}
                            defaultValue=""
                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="">Durum değiştir...</option>
                            {sortedWorkflowStatuses.map((s) => (
                                <option key={s.id} value={s.name}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        <select
                            onChange={(e) => handleBulkReassign(e.target.value)}
                            defaultValue=""
                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="" disabled>Ata...</option>
                            <option value="">Atanmamış yap</option>
                            {members?.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                    {m.userName}
                                </option>
                            ))}
                        </select>

                        <select
                            onChange={(e) => e.target.value !== undefined && handleBulkMoveToSprint(e.target.value)}
                            defaultValue=""
                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="" disabled>Sprint'e taşı...</option>
                            <option value="">Backlog'a taşı</option>
                            {sprints?.filter((s) => s.status === 'Active').map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        <select
                            onChange={(e) => e.target.value && handleBulkAddLabel(e.target.value)}
                            defaultValue=""
                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="">Etiket ekle...</option>
                            {allLabels?.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleBulkDelete}
                            className="cursor-pointer rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                            Sil
                        </button>

                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="ml-auto cursor-pointer rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        >
                            Seçimi temizle
                        </button>
                    </div>
                </div>
            )}

            {bulkMessage && (
                <div className="mx-4 sm:mx-5 mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 shrink-0">
                    {bulkMessage}
                </div>
            )}

            {/* Liste / Tablo Bölümü */}
            {isLoading ? (
                <div className="flex min-h-[360px] items-center justify-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Issue'lar yükleniyor...
                    </div>
                </div>
            ) : !tasks || tasks.length === 0 ? (
                <div className="mx-4 sm:mx-5 mt-4 rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Sonuç bulunamadı
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Seçtiğiniz filtrelere uyan issue bulunmuyor.
                    </p>
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-auto px-4 sm:px-5 py-4">
                    <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <table className="w-full min-w-[850px] border-separate border-spacing-0 text-sm">
                            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                <tr>
                                    {isPM && (
                                        <th className="w-10 px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleAll}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                            />
                                        </th>
                                    )}
                                    <th className="px-3 py-2.5 text-left">Issue</th>
                                    <th className="px-3 py-2.5 text-left">Tip</th>
                                    <th className="px-3 py-2.5 text-left">Öncelik</th>
                                    <th className="px-3 py-2.5 text-left">Durum</th>
                                    <th className="px-3 py-2.5 text-left">SP</th>
                                    <th className="px-3 py-2.5 text-left">Atanan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {tasks.map((t) => (
                                    <tr
                                        key={t.id}
                                        className={`group transition-colors ${selectedIds.has(t.id)
                                            ? 'bg-blue-50/80 dark:bg-blue-950/40'
                                            : 'bg-white hover:bg-gray-50/80 dark:bg-gray-900 dark:hover:bg-gray-800/60'
                                            }`}
                                    >
                                        {isPM && (
                                            <td className="w-10 px-3 py-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(t.id)}
                                                    onChange={() => toggleOne(t.id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                                />
                                            </td>
                                        )}
                                        <td className="max-w-[360px] sm:max-w-[520px] px-3 py-2.5">
                                            <Link to={taskDetailUrl(t.issueKey ?? t.id)} className="block min-w-0">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className="shrink-0 font-mono text-[11px] font-medium text-blue-600 dark:text-blue-400">
                                                        {t.issueKey}
                                                    </span>
                                                    <span className="truncate text-xs font-medium text-gray-800 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                                                        {t.title}
                                                    </span>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                {t.issueType}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900">
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {t.storyPoint ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            {t.assigneeName ? (
                                                <span className="inline-flex max-w-[140px] sm:max-w-[180px] truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                    {t.assigneeName}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    Atanmamış
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3">
                        <PaginationBar
                            page={page}
                            onPageChange={setPage}
                            hasNextPage={tasks.length === pageSize}
                            totalOnPage={tasks.length}
                        />
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                danger={confirmState.danger}
                confirmLabel="Sil"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}