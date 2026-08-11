import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useTasks } from '../../hooks/useTasks';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useProjectIssueTypes } from '../../hooks/useProjectIssueTypes';
import { useBulkUpdateStatus, useBulkReassign } from '../../hooks/useBulkTaskActions';
import { PRIORITY_LABELS } from '../../types/task';
import { SavedFiltersBar } from '../../components/SavedFiltersBar';
import { STATUS_TO_INT } from '../../lib/taskStatus';
import type { ItemStatus } from '../../types/task';

const STATUS_OPTIONS: ItemStatus[] = ['ToDo', 'InProgress', 'ReadyForReview', 'ReadyForQA', 'Done', 'Closed'];

export function IssueListPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const currentUser = useAuthStore((state) => state.user);
    const isPM = currentUser?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [issueTypeId, setIssueTypeId] = useState('');
    const [priority, setPriority] = useState('');

    const { data: issueTypes } = useProjectIssueTypes(selectedProjectId);

    const { data: tasks, isLoading } = useTasks(selectedProjectId, {
        search: search || undefined,
        status: status || undefined,
        issueTypeId: issueTypeId || undefined,
        priority: priority ? Number(priority) : undefined,
    });

    const { data: members } = useProjectMembers(selectedProjectId);
    const bulkUpdateStatus = useBulkUpdateStatus(selectedProjectId ?? '');
    const bulkReassign = useBulkReassign(selectedProjectId ?? '');

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkMessage, setBulkMessage] = useState<string | null>(null);

    useEffect(() => {
        setSearch('');
        setStatus('');
        setIssueTypeId('');
        setPriority('');
        setSelectedIds(new Set());
        setBulkMessage(null);
    }, [selectedProjectId]);

    if (!selectedProjectId) {
        return <p className="text-gray-500">Devam etmek için üstten bir proje seçin.</p>;
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
        const result = await bulkUpdateStatus.mutateAsync({
            taskIds: Array.from(selectedIds),
            status: STATUS_TO_INT[newStatus as ItemStatus],
        });
        setBulkMessage(
            `${result.successCount} görev güncellendi${result.failCount > 0 ? `, ${result.failCount} tanesi başarısız oldu` : ''}.`
        );
        setSelectedIds(new Set());
    };

    const handleBulkReassign = async (userId: string) => {
        if (selectedIds.size === 0) return;
        setBulkMessage(null);
        const result = await bulkReassign.mutateAsync({ taskIds: Array.from(selectedIds), assigneeId: userId || null });
        setBulkMessage(
            `${result.successCount} görev atandı${result.failCount > 0 ? `, ${result.failCount} tanesi başarısız oldu` : ''}.`
        );
        setSelectedIds(new Set());
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Issue Listesi</h1>

            <div className="flex flex-wrap gap-2">
                <input
                    type="text"
                    placeholder="Başlıkta ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border rounded px-3 py-1.5 text-sm flex-1 min-w-[180px]"
                />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
                    <option value="">Tüm Durumlar</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <select value={issueTypeId} onChange={(e) => setIssueTypeId(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
                    <option value="">Tüm Tipler</option>
                    {issueTypes?.map((t) => (
                        <option key={t.issueTypeId} value={t.issueTypeId}>
                            {t.icon ? `${t.icon} ` : ''}{t.name}
                        </option>
                    ))}
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
                    <option value="">Tüm Öncelikler</option>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            {isPM && selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                    <span className="text-sm text-indigo-700 font-medium">{selectedIds.size} görev seçildi</span>
                    <select onChange={(e) => e.target.value && handleBulkStatus(e.target.value)} defaultValue="" className="border rounded px-2 py-1 text-sm">
                        <option value="">Durum değiştir...</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <select onChange={(e) => handleBulkReassign(e.target.value)} defaultValue="" className="border rounded px-2 py-1 text-sm">
                        <option value="" disabled>
                            Ata...
                        </option>
                        <option value="">Atanmamış yap</option>
                        {members?.map((m) => (
                            <option key={m.userId} value={m.userId}>
                                {m.userName}
                            </option>
                        ))}
                    </select>
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:underline ml-auto">
                        Seçimi Temizle
                    </button>
                </div>
            )}

            {bulkMessage && <p className="text-sm text-green-600">{bulkMessage}</p>}

            {isLoading ? (
                <p className="text-gray-500">Yükleniyor...</p>
            ) : !tasks || tasks.length === 0 ? (
                <p className="text-gray-400 text-sm">Sonuç bulunamadı.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm bg-white border rounded-lg overflow-hidden">
                        <thead>
                            <tr className="text-left text-gray-500 bg-gray-50">
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
                                <tr key={t.id} className={`border-t hover:bg-gray-50 ${selectedIds.has(t.id) ? 'bg-indigo-50' : ''}`}>
                                    {isPM && (
                                        <td className="px-3 py-2">
                                            <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleOne(t.id)} />
                                        </td>
                                    )}
                                    <td className="px-3 py-2">
                                        <Link to={`/tasks/${t.id}`} className="text-indigo-600 hover:underline">
                                            {t.title}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2 text-gray-500">{t.issueType}</td>
                                    <td className="px-3 py-2 text-gray-500">{t.priority}</td>
                                    <td className="px-3 py-2 text-gray-500">{t.status}</td>
                                    <td className="px-3 py-2 text-gray-500">{t.storyPoint ?? '-'}</td>
                                    <td className="px-3 py-2 text-gray-500">{t.assigneeName ?? 'Atanmamış'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}