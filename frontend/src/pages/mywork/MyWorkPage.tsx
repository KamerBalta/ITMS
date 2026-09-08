import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMyWork } from '../../hooks/useMyWork';
import { MyWorkBoardView } from '../../components/MyWorkBoardView';
import {
    Search,
    CheckCircle2,
    Bookmark,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Minus,
    X,
    List as ListIcon,
    Kanban
} from 'lucide-react';

const taskDetailUrl = (issueKey?: string, taskId?: string) =>
    issueKey ? `/browse/${issueKey}` : `/tasks/${taskId}`;

const STATUS_STYLES: Record<string, string> = {
    ToDo: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    InProgress: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    ReadyForReview: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    ReadyForQA: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    Done: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    Closed: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600',
};

// Issue Type İkonları
function IssueTypeIcon({ type }: { type: string }) {
    const normalized = type?.toLowerCase() ?? '';

    if (normalized.includes('bug')) {
        return (
            <span
                title="Bug"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400"
            >
                <AlertCircle className="w-3.5 h-3.5" />
            </span>
        );
    }

    if (normalized.includes('epic')) {
        return (
            <span
                title="Epic"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
            >
                <Bookmark className="w-3.5 h-3.5" />
            </span>
        );
    }

    if (normalized.includes('story')) {
        return (
            <span
                title="Story"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
            >
                <Bookmark className="w-3.5 h-3.5" />
            </span>
        );
    }

    return (
        <span
            title="Task"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
        >
            <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
    );
}

// Priority İkonları (0: Low, 1: Medium, 2: High, 3: Critical)
function PriorityIcon({ priority }: { priority?: string | number }) {
    const p = String(priority ?? '').toLowerCase();

    if (p === 'critical' || p === '3') {
        return (
            <span title="Critical">
                <ArrowUp className="w-3.5 h-3.5 text-red-600 dark:text-red-400 font-bold shrink-0" />
            </span>
        );
    }

    if (p === 'high' || p === '2') {
        return (
            <span title="High">
                <ArrowUp className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
            </span>
        );
    }

    if (p === 'medium' || p === '1') {
        return (
            <span title="Medium">
                <Minus className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            </span>
        );
    }

    if (p === 'low' || p === '0') {
        return (
            <span title="Low">
                <ArrowDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
            </span>
        );
    }

    return (
        <span title="Unknown">
            <Minus className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
        </span>
    );
}

export function MyWorkPage() {
    const { items, isLoading } = useMyWork();

    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');

    // Açık görevler
    const activeItems = useMemo(
        () =>
            (items ?? []).filter(
                (i) => i.status !== 'Done' && i.status !== 'Closed'
            ),
        [items]
    );

    // Tamamlanmış görevler
    const completedItems = useMemo(
        () =>
            (items ?? []).filter(
                (i) => i.status === 'Done' || i.status === 'Closed'
            ),
        [items]
    );

    // Tab + filtre uygulaması
    const filteredList = useMemo(() => {
        const targetList =
            activeTab === 'open' ? activeItems : completedItems;

        return targetList.filter((item) => {
            const matchesSearch = item.title
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchesStatus = selectedStatus
                ? item.status === selectedStatus
                : true;

            const matchesPriority = selectedPriority
                ? String(item.priority).toLowerCase() ===
                selectedPriority.toLowerCase()
                : true;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [
        activeTab,
        activeItems,
        completedItems,
        search,
        selectedStatus,
        selectedPriority
    ]);

    // Projeye göre gruplama
    const groupedByProject = useMemo(() => {
        return filteredList.reduce<Record<string, typeof filteredList>>(
            (acc, item) => {
                (acc[item.projectName] ??= []).push(item);
                return acc;
            },
            {}
        );
    }, [filteredList]);

    if (isLoading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center bg-[#f7f8fa] dark:bg-gray-950">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Yükleniyor...
                </p>
            </div>
        );
    }

    const hasActiveFilters = Boolean(
        search || selectedStatus || selectedPriority
    );

    return (
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-auto bg-[#f7f8fa] px-0 dark:bg-gray-950">
            {/* Başlık ve Görünüm Seçici */}
            <div className="flex min-h-[64px] shrink-0 flex-col justify-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                    <h1 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                        My work
                    </h1>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        Assigned to me
                    </p>
                </div>

                {/* Görünüm Anahtarı */}
                <div className="flex items-center gap-0.5 self-start rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800 sm:self-auto">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${viewMode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400'
                                : 'text-secondary hover:text-primary'
                            }`}
                    >
                        <ListIcon className="w-3.5 h-3.5" />
                        Liste
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${viewMode === 'board'
                                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400'
                                : 'text-secondary hover:text-primary'
                            }`}
                    >
                        <Kanban className="w-3.5 h-3.5" />
                        Board
                    </button>
                </div>
            </div>

            {viewMode === 'board' ? (
                <MyWorkBoardView />
            ) : (
                <div className="px-4 py-4 sm:px-5 space-y-4">
                    {/* Özet Kartları */}
                    <div className="grid grid-cols-3 overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <div className="border-r border-gray-200 p-3 last:border-r-0 dark:border-gray-800 sm:p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                OPEN
                            </p>
                            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">
                                {activeItems.length}
                            </p>
                        </div>

                        <div className="border-r border-gray-200 p-3 last:border-r-0 dark:border-gray-800 sm:p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                DONE
                            </p>
                            <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                                {completedItems.length}
                            </p>
                        </div>

                        <div className="border-r border-gray-200 p-3 last:border-r-0 dark:border-gray-800 sm:p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                TOTAL
                            </p>
                            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">
                                {(items ?? []).length}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-5 border-b border-gray-200 text-[13px] font-medium dark:border-gray-800">
                        <button
                            onClick={() => setActiveTab('open')}
                            className={`pb-2.5 transition relative cursor-pointer ${activeTab === 'open'
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Open ({activeItems.length})
                        </button>

                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`pb-2.5 transition relative cursor-pointer ${activeTab === 'completed'
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Completed ({completedItems.length})
                        </button>
                    </div>

                    {/* Filtreler */}
                    <div className="flex flex-col items-stretch gap-2 border-b border-gray-200 bg-white py-3 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full input-base rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                <option value="">Status: All</option>

                                {Array.from(new Set((items ?? []).map((item) => item.status)))
                                    .filter(Boolean)
                                    .map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                            </select>

                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                <option value="">Priority: All</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>

                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedStatus('');
                                        setSelectedPriority('');
                                    }}
                                    className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer"
                                    title="Clear Filters"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Liste */}
                    {Object.keys(groupedByProject).length === 0 ? (
                        <div className="border-t border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                            {activeTab === 'open'
                                ? 'Şu anda size atanmış açık bir görev yok.'
                                : 'Tamamlanmış görev bulunamadı.'}
                        </div>
                    ) : (
                        Object.entries(groupedByProject).map(
                            ([projectName, tasks]) => (
                                <div
                                    key={projectName}
                                    className="space-y-1"
                                >
                                    {/* Proje Başlığı */}
                                    <div className="mt-5 mb-2 flex items-center gap-2">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-600 text-[10px] font-semibold uppercase text-white dark:bg-blue-500">
                                            {projectName.charAt(0)}
                                        </div>

                                        <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                                            {projectName}
                                        </h2>

                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                            ({tasks.length})
                                        </span>
                                    </div>

                                    {/* Task Listesi */}
                                    <div className="overflow-hidden rounded-md border border-gray-200 bg-white divide-y divide-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:divide-gray-800">
                                        {tasks.map((t) => (
                                            <Link
                                                key={t.id}
                                                to={taskDetailUrl(t.issueKey, t.id)}
                                                className="group flex min-h-[44px] items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer"
                                            >
                                                {/* Sol */}
                                                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                                    <IssueTypeIcon
                                                        type={t.issueType}
                                                    />

                                                    {/* Task ID / Issue Key */}
                                                    <span className="shrink-0 font-mono text-[11px] font-medium text-blue-600 dark:text-blue-400">
                                                        {t.issueKey ?? `#${t.id.slice(0, 5)}`}
                                                    </span>

                                                    {/* Priority */}
                                                    <PriorityIcon
                                                        priority={t.priority}
                                                    />

                                                    {/* Başlık */}
                                                    <span className="truncate font-medium text-gray-800 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                                                        {t.title}
                                                    </span>
                                                </div>

                                                {/* Sağ */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {/* Story Point */}
                                                    {t.storyPoint !== null &&
                                                        t.storyPoint !== undefined && (
                                                            <div
                                                                className="flex h-5 min-w-5 items-center justify-center rounded-full border border-gray-300 bg-gray-100 px-1 text-[10px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                                title="Story Point"
                                                            >
                                                                {t.storyPoint}
                                                            </div>
                                                        )}

                                                    {/* Status */}
                                                    <span
                                                        className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[t.status] ??
                                                            'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                                            }`}
                                                    >
                                                        {t.status}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )
                        )
                    )}
                </div>
            )}
        </div>
    );
}