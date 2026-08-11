import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMyWork } from '../../hooks/useMyWork';
import {
    Search,
    CheckCircle2,
    Bookmark,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Minus,
    Calendar,
    X
} from 'lucide-react';

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
            <span title="Bug" className="p-1 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
            </span>
        );
    }
    if (normalized.includes('epic')) {
        return (
            <span title="Epic" className="p-1 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                <Bookmark className="w-3.5 h-3.5" />
            </span>
        );
    }
    if (normalized.includes('story')) {
        return (
            <span title="Story" className="p-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Bookmark className="w-3.5 h-3.5" />
            </span>
        );
    }
    return (
        <span title="Task" className="p-1 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
    );
}

// Priority İkonları
function PriorityIcon({ priority }: { priority?: string | number }) {
    const p = String(priority ?? '').toLowerCase();
    if (p === 'highest' || p === '5') {
        return <ArrowUp className="w-3.5 h-3.5 text-red-600 dark:text-red-400 font-bold shrink-0" title="Highest" />;
    }
    if (p === 'high' || p === '4') {
        return <ArrowUp className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" title="High" />;
    }
    if (p === 'medium' || p === '3') {
        return <Minus className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" title="Medium" />;
    }
    if (p === 'low' || p === '2') {
        return <ArrowDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" title="Low" />;
    }
    if (p === 'lowest' || p === '1') {
        return <ArrowDown className="w-3.5 h-3.5 text-muted shrink-0" title="Lowest" />;
    }
    return <Minus className="w-3.5 h-3.5 text-muted shrink-0" title="Normal" />;
}

export function MyWorkPage() {
    const { items, isLoading } = useMyWork();

    const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');

    // Açık ve Tamamlanmış Görev Mantığı
    const activeItems = useMemo(
        () => (items ?? []).filter((i) => i.status !== 'Done' && i.status !== 'Closed'),
        [items]
    );

    const completedItems = useMemo(
        () => (items ?? []).filter((i) => i.status === 'Done' || i.status === 'Closed'),
        [items]
    );

    // Tab & Filtre Uygulaması
    const filteredList = useMemo(() => {
        const targetList = activeTab === 'open' ? activeItems : completedItems;

        return targetList.filter((item) => {
            const matchesSearch =
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                (item.taskKey && item.taskKey.toLowerCase().includes(search.toLowerCase()));

            const matchesStatus = selectedStatus ? item.status === selectedStatus : true;

            const matchesPriority = selectedPriority
                ? String(item.priority).toLowerCase() === selectedPriority.toLowerCase()
                : true;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [activeTab, activeItems, completedItems, search, selectedStatus, selectedPriority]);

    // Projeye Göre Gruplama
    const groupedByProject = useMemo(() => {
        return filteredList.reduce<Record<string, typeof filteredList>>((acc, item) => {
            (acc[item.projectName] ??= []).push(item);
            return acc;
        }, {});
    }, [filteredList]);

    if (isLoading) {
        return <p className="text-secondary text-sm p-4">Yükleniyor...</p>;
    }

    const hasActiveFilters = Boolean(search || selectedStatus || selectedPriority);

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-primary">My work</h1>
                    <p className="text-sm text-secondary mt-0.5">Assigned to me</p>
                </div>
            </div>


            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">OPEN</p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{activeItems.length}</p>
                </div>

                <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">DONE</p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedItems.length}</p>
                </div>

                <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">TOTAL</p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{(items ?? []).length}</p>
                </div>
            </div>

            {/* 13. Sekmeler (Tabs: Open & Completed) */}
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('open')}
                    className={`pb-2.5 transition relative cursor-pointer ${activeTab === 'open'
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-muted hover:text-primary'
                        }`}
                >
                    Open ({activeItems.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`pb-2.5 transition relative cursor-pointer ${activeTab === 'completed'
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-muted hover:text-primary'
                        }`}
                >
                    Completed ({completedItems.length})
                </button>
            </div>

            {/* 12. Filtre Çubuğu */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 surface p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xs">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                    <input
                        type="text"
                        placeholder="Search tasks or keys..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full input-base border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="input-base border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="">Status: All</option>
                        <option value="ToDo">To Do</option>
                        <option value="InProgress">In Progress</option>
                        <option value="ReadyForReview">Ready For Review</option>
                        <option value="ReadyForQA">Ready For QA</option>
                        <option value="Done">Done</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="input-base border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="">Priority: All</option>
                        <option value="highest">Highest</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="lowest">Lowest</option>
                    </select>

                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setSelectedStatus('');
                                setSelectedPriority('');
                            }}
                            className="p-1.5 text-muted hover:text-primary transition rounded-md hover-surface cursor-pointer"
                            title="Clear Filters"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Liste Görünümü */}
            {Object.keys(groupedByProject).length === 0 ? (
                <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-muted text-sm">
                    {activeTab === 'open'
                        ? 'Şu anda size atanmış açık bir görev yok. 🎉'
                        : 'Tamamlanmış görev bulunamadı.'}
                </div>
            ) : (
                Object.entries(groupedByProject).map(([projectName, tasks]) => (
                    <div key={projectName} className="space-y-1">
                        {/* 3. Proje Başlıkları (Avatar + Görev Sayısı) */}
                        <div className="flex items-center gap-2 mb-2 mt-6">
                            <div className="w-6 h-6 rounded bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                {projectName.charAt(0)}
                            </div>
                            <h2 className="font-semibold text-primary text-sm">{projectName}</h2>
                            <span className="text-xs text-muted font-normal">({tasks.length})</span>
                        </div>

                        {/* 4 & 14. Jira Liste Satırları (Kartsız, border-b ve hover:bg-slate-50) */}
                        <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden shadow-2xs">
                            {tasks.map((t) => {
                                const isOverdue =
                                    t.dueDate &&
                                    new Date(t.dueDate) < new Date() &&
                                    t.status !== 'Done' &&
                                    t.status !== 'Closed';

                                return (
                                    <Link
                                        key={t.id}
                                        to={`/tasks/${t.id}`}
                                        className="flex items-center justify-between px-3.5 py-2.5 hover-surface hover:shadow dark:hover:shadow-black/30 transition text-sm group cursor-pointer"
                                    >
                                        {/* Sol Kısım: İkon + Key + Başlık */}
                                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                            {/* 5. Issue Type İkonu */}
                                            <IssueTypeIcon type={t.issueType} />

                                            {/* 6. Task Key (Örn: INF-24) */}
                                            {t.taskKey ? (
                                                <span className="text-xs font-mono font-medium text-secondary shrink-0">
                                                    {t.taskKey}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-mono text-muted shrink-0">
                                                    #{t.id.slice(0, 5)}
                                                </span>
                                            )}

                                            {/* 10. Priority İkonu */}
                                            <PriorityIcon priority={t.priority} />

                                            {/* Başlık */}
                                            <span className="truncate font-medium text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                                {t.title}
                                            </span>
                                        </div>

                                        {/* Sağ Kısım: Due Date + Story Point + Status + Avatar */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* 11. Due Date */}
                                            {t.dueDate && (
                                                <div
                                                    className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${isOverdue
                                                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/60'
                                                        : 'text-secondary'
                                                        }`}
                                                    title={`Teslim Tarihi: ${new Date(t.dueDate).toLocaleDateString('tr-TR')}`}
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(t.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            )}

                                            {/* 7. Story Point (Yuvarlak Gri Rozet ○ 5) */}
                                            {t.storyPoint !== null && t.storyPoint !== undefined && (
                                                <div className="w-5 h-5 rounded-full surface-muted text-secondary border border-gray-200 dark:border-gray-700 flex items-center justify-center text-[11px] font-bold" title="Story Point">
                                                    {t.storyPoint}
                                                </div>
                                            )}

                                            {/* 8. Status Badge */}
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${STATUS_STYLES[t.status] ?? 'surface-muted text-secondary border-gray-200 dark:border-gray-700'
                                                    }`}
                                            >
                                                {t.status}
                                            </span>

                                            {/* 9. Atanan Kişi Avatarı */}
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0" title={t.assigneeName ?? 'Assigned'}>
                                                {t.assigneeName ? t.assigneeName.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}