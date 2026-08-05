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
    ToDo: 'bg-slate-100 text-slate-700 border-slate-200',
    InProgress: 'bg-blue-100 text-blue-700 border-blue-200',
    ReadyForReview: 'bg-amber-100 text-amber-800 border-amber-200',
    ReadyForQA: 'bg-purple-100 text-purple-700 border-purple-200',
    Done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Closed: 'bg-slate-200 text-slate-600 border-slate-300',
};

// Issue Type İkonları
function IssueTypeIcon({ type }: { type: string }) {
    const normalized = type?.toLowerCase() ?? '';
    if (normalized.includes('bug')) {
        return (
            <span title="Bug" className="p-1 rounded bg-red-100 text-red-600 shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
            </span>
        );
    }
    if (normalized.includes('epic')) {
        return (
            <span title="Epic" className="p-1 rounded bg-purple-100 text-purple-600 shrink-0">
                <Bookmark className="w-3.5 h-3.5" />
            </span>
        );
    }
    if (normalized.includes('story')) {
        return (
            <span title="Story" className="p-1 rounded bg-emerald-100 text-emerald-600 shrink-0">
                <Bookmark className="w-3.5 h-3.5" />
            </span>
        );
    }
    return (
        <span title="Task" className="p-1 rounded bg-blue-100 text-blue-600 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
    );
}

// Priority İkonları
function PriorityIcon({ priority }: { priority?: string | number }) {
    const p = String(priority ?? '').toLowerCase();
    if (p === 'highest' || p === '5') {
        return <ArrowUp className="w-3.5 h-3.5 text-red-600 font-bold shrink-0" title="Highest" />;
    }
    if (p === 'high' || p === '4') {
        return <ArrowUp className="w-3.5 h-3.5 text-orange-500 shrink-0" title="High" />;
    }
    if (p === 'medium' || p === '3') {
        return <Minus className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Medium" />;
    }
    if (p === 'low' || p === '2') {
        return <ArrowDown className="w-3.5 h-3.5 text-blue-500 shrink-0" title="Low" />;
    }
    if (p === 'lowest' || p === '1') {
        return <ArrowDown className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Lowest" />;
    }
    return <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Normal" />;
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
        return <p className="text-slate-500 text-sm p-4">Yükleniyor...</p>;
    }

    const hasActiveFilters = Boolean(search || selectedStatus || selectedPriority);

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">My work</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Assigned to me</p>
                </div>
            </div>

            
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OPEN</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{activeItems.length}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DONE</p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">{completedItems.length}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TOTAL</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{(items ?? []).length}</p>
                </div>
            </div>

            {/* 13. Sekmeler (Tabs: Open & Completed) */}
            <div className="flex items-center gap-6 border-b border-slate-200 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('open')}
                    className={`pb-2.5 transition relative ${activeTab === 'open'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    Open ({activeItems.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`pb-2.5 transition relative ${activeTab === 'completed'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    Completed ({completedItems.length})
                </button>
            </div>

            {/* 12. Filtre Çubuğu */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-2xs">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks or keys..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            className="p-1.5 text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-100"
                            title="Clear Filters"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Liste Görünümü */}
            {Object.keys(groupedByProject).length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                    {activeTab === 'open'
                        ? 'Şu anda size atanmış açık bir görev yok. 🎉'
                        : 'Tamamlanmış görev bulunamadı.'}
                </div>
            ) : (
                Object.entries(groupedByProject).map(([projectName, tasks]) => (
                    <div key={projectName} className="space-y-1">
                        {/* 3. Proje Başlıkları (Avatar + Görev Sayısı) */}
                        <div className="flex items-center gap-2 mb-2 mt-6">
                            <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                {projectName.charAt(0)}
                            </div>
                            <h2 className="font-semibold text-slate-900 text-sm">{projectName}</h2>
                            <span className="text-xs text-slate-400 font-normal">({tasks.length})</span>
                        </div>

                        {/* 4 & 14. Jira Liste Satırları (Kartsız, border-b ve hover:bg-slate-50) */}
                        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
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
                                        className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50/80 transition text-sm group"
                                    >
                                        {/* Sol Kısım: İkon + Key + Başlık */}
                                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                            {/* 5. Issue Type İkonu */}
                                            <IssueTypeIcon type={t.issueType} />

                                            {/* 6. Task Key (Örn: INF-24) */}
                                            {t.taskKey ? (
                                                <span className="text-xs font-mono font-medium text-slate-500 shrink-0">
                                                    {t.taskKey}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-mono text-slate-400 shrink-0">
                                                    #{t.id.slice(0, 5)}
                                                </span>
                                            )}

                                            {/* 10. Priority İkonu */}
                                            <PriorityIcon priority={t.priority} />

                                            {/* Başlık */}
                                            <span className="truncate font-medium text-slate-800 group-hover:text-indigo-600 transition">
                                                {t.title}
                                            </span>
                                        </div>

                                        {/* Sağ Kısım: Due Date + Story Point + Status + Avatar */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* 11. Due Date */}
                                            {t.dueDate && (
                                                <div
                                                    className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${isOverdue
                                                            ? 'bg-red-50 text-red-600 border border-red-100'
                                                            : 'text-slate-500'
                                                        }`}
                                                    title={`Teslim Tarihi: ${new Date(t.dueDate).toLocaleDateString('tr-TR')}`}
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(t.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            )}

                                            {/* 7. Story Point (Yuvarlak Gri Rozet ○ 5) */}
                                            {t.storyPoint !== null && t.storyPoint !== undefined && (
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-[11px] font-bold" title="Story Point">
                                                    {t.storyPoint}
                                                </div>
                                            )}

                                            {/* 8. Status Badge */}
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${STATUS_STYLES[t.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}
                                            >
                                                {t.status}
                                            </span>

                                            {/* 9. Atanan Kişi Avatarı */}
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center border border-indigo-200 shrink-0" title={t.assigneeName ?? 'Assigned'}>
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