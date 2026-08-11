import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useTasks } from '../../hooks/useTasks';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useProjectIssueTypes } from '../../hooks/useProjectIssueTypes';
import { useBulkUpdateStatus, useBulkReassign } from '../../hooks/useBulkTaskActions';
import { usePagination } from '../../hooks/usePagination';
import { PaginationBar } from '../../components/PaginationBar';
import { PRIORITY_LABELS } from '../../types/task';
import { STATUS_TO_INT } from '../../lib/taskStatus';
import type { ItemStatus } from '../../types/task';

const STATUS_OPTIONS: ItemStatus[] = ['ToDo', 'InProgress', 'ReadyForReview', 'ReadyForQA', 'Done', 'Closed'];

export function IssueListPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const currentUser = useAuthStore((state) => state.user);
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('q') ?? '');
    const [status, setStatus] = useState(searchParams.get('status') ?? '');
    const [issueTypeId, setIssueTypeId] = useState(searchParams.get('type') ?? '');
    const [priority, setPriority] = useState(searchParams.get('priority') ?? '');

    // #JQL-benzeri: filtre state'ini URL query string'e senkronize et -- boylece link paylasilabilir
    useEffect(() => {
        const params: Record<string, string> = {};
        if (search) params.q = search;
        if (status) params.status = status;
        if (issueTypeId) params.type = issueTypeId;
        if (priority) params.priority = priority;
        setSearchParams(params, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, issueTypeId, priority]);

    const { data: issueTypes } = useProjectIssueTypes(selectedProjectId);

    const { page, setPage, pageSize, reset: resetPagination } = usePagination(25);

    const { data: tasks, isLoading } = useTasks(selectedProjectId, {
        search: search || undefined,
        status: status || undefined,
        issueTypeId: issueTypeId || undefined,
        priority: priority ? Number(priority) : undefined,
        page,
        pageSize,
    });

    const { data: members } = useProjectMembers(selectedProjectId);
    const bulkUpdateStatus = useBulkUpdateStatus(selectedProjectId ?? '');
    const bulkReassign = useBulkReassign(selectedProjectId ?? '');

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkMessage, setBulkMessage] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        setSearch('');
        setStatus('');
        setIssueTypeId('');
        setPriority('');
        setSelectedIds(new Set());
        setBulkMessage(null);
        resetPagination();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId]);

    useEffect(() => {
        resetPagination();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, issueTypeId, priority]);

    if (!selectedProjectId) {
        return <p className="text-secondary">Devam etmek için üstten bir proje seçin.</p>;
    }

    const allSelected = tasks && tasks.length > 0 && selectedIds.size === tasks.length;

    const toggleAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(tasks?.map((t) => t.id) ?? []));
    };

    const toggleOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkStatus = async (newStatus: string) => {
        if (selectedIds.size === 0) return;
        setBulkMessage(null);
        const result = await bulkUpdateStatus.mutateAsync({ taskIds: Array.from(selectedIds), status: STATUS_TO_INT[newStatus as ItemStatus] });
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

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary">Issue Listesi</h1>
                <button onClick={handleCopyLink} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    {copiedLink ? '✓ Kopyalandı' : '🔗 Bu Görünümü Paylaş'}
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                <input type="text" placeholder="Başlıkta ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-base border rounded px-3 py-1.5 text-sm flex-1 min-w-[180px]" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-base border rounded px-3 py-1.5 text-sm">
                    <option value="">Tüm Durumlar</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select value={issueTypeId} onChange={(e) => setIssueTypeId(e.target.value)} className="input-base border rounded px-3 py-1.5 text-sm">
                    <option value="">Tüm Tipler</option>
                    {issueTypes?.map((t) => (
                        <option key={t.issueTypeId} value={t.issueTypeId}>{t.icon ? `${t.icon} ` : ''}{t.name}</option>
                    ))}
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-base border rounded px-3 py-1.5 text-sm">
                    <option value="">Tüm Öncelikler</option>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {isPM && selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2">
                    <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">{selectedIds.size} görev seçildi</span>
                    <select onChange={(e) => e.target.value && handleBulkStatus(e.target.value)} defaultValue="" className="input-base border rounded px-2 py-1 text-sm">
                        <option value="">Durum değiştir...</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select onChange={(e) => handleBulkReassign(e.target.value)} defaultValue="" className="input-base border rounded px-2 py-1 text-sm">
                        <option value="" disabled>Ata...</option>
                        <option value="">Atanmamış yap</option>
                        {members?.map((m) => (
                            <option key={m.userId} value={m.userId}>{m.userName}</option>
                        ))}
                    </select>
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted hover:underline ml-auto">
                        Seçimi Temizle
                    </button>
                </div>
            )}

            {bulkMessage && <p className="text-sm text-green-600 dark:text-green-400">{bulkMessage}</p>}

            {isLoading ? (
                <p className="text-secondary">Yükleniyor...</p>
            ) : !tasks || tasks.length === 0 ? (
                <p className="text-muted text-sm">Sonuç bulunamadı.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm surface border rounded-lg overflow-hidden">
                            <thead>
                                <tr className="text-left text-secondary surface-muted">
                                    {isPM && (
                                        <th className="px-3 py-2 w-8">
                                            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                                        </th>
                                    )}
                                    <th className="px-3 py-2">Başlık</th>
                                    <th className="px-3 py-2">Tip</th>
                                    <th className="px-3 py-2">Öncelik</th>
                                    <th className="px-3 py-2">Durum</th>
                                    <th className="px-3 py-2">SP</th>
                                    <th className="px-3 py-2">Atanan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((t) => (
                                    <tr key={t.id} className={`border-t border-gray-100 dark:border-gray-800 hover-surface ${selectedIds.has(t.id) ? 'bg-indigo-50 dark:bg-indigo-950' : ''}`}>
                                        {isPM && (
                                            <td className="px-3 py-2">
                                                <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleOne(t.id)} />
                                            </td>
                                        )}
                                        <td className="px-3 py-2">
                                            <Link to={`/tasks/${t.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{t.title}</Link>
                                        </td>
                                        <td className="px-3 py-2 text-secondary">{t.issueType}</td>
                                        <td className="px-3 py-2 text-secondary">{t.priority}</td>
                                        <td className="px-3 py-2 text-secondary">{t.status}</td>
                                        <td className="px-3 py-2 text-secondary">{t.storyPoint ?? '-'}</td>
                                        <td className="px-3 py-2 text-secondary">{t.assigneeName ?? 'Atanmamış'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {tasks && tasks.length > 0 && (
                        <PaginationBar page={page} onPageChange={setPage} hasNextPage={tasks.length === pageSize} totalOnPage={tasks.length} />
                    )}
                </>
            )}
        </div>
    );
}