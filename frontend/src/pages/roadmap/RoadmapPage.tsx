import { Link } from 'react-router-dom';
import { useMemo, useState, useRef } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronRight as ChevronRightIcon,
    Filter,
    Settings2,
    Search,
    MoreHorizontal,
    CalendarDays,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useRoadmap } from '../../hooks/useRoadmap';

function daysBetween(a: Date, b: Date) {
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export function RoadmapPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const { data: epics, isLoading } = useRoadmap(selectedProjectId);

    const [zoom, setZoom] = useState<'week' | 'month' | 'quarter'>('week');
    const [showCompleted, setShowCompleted] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedEpics, setExpandedEpics] = useState<string[]>([]);

    const timelineRef = useRef<HTMLDivElement>(null);

    if (!selectedProjectId) {
        return <p className="text-secondary p-4">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (isLoading) return <p className="text-secondary p-4">Yükleniyor...</p>;

    const filteredEpics = useMemo(() => {
        return (epics ?? []).filter((epic) => {
            const matchesSearch = epic.title.toLowerCase().includes(search.toLowerCase());
            const progress = epic.totalTasks > 0 ? Math.round((epic.doneTasks / epic.totalTasks) * 100) : 0;
            const matchesCompleted = showCompleted || progress < 100;

            return matchesSearch && matchesCompleted;
        });
    }, [epics, search, showCompleted]);

    const epicsWithDates = filteredEpics.filter((e) => e.earliestSprintStart && e.latestSprintEnd);
    const epicsWithoutDates = filteredEpics.filter((e) => !e.earliestSprintStart || !e.latestSprintEnd);

    if (epicsWithDates.length === 0 && epicsWithoutDates.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-surface p-10 text-center m-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
                    <CalendarDays className="h-6 w-6 text-secondary" />
                </div>
                <h2 className="text-lg font-semibold text-primary">Roadmap'de gösterilecek Epic yok</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary">
                    Sprint'e bağlanmış görevleri olan Epic'ler burada zaman çizelgesinde gösterilir.
                </p>
            </div>
        );
    }

    const minDate = epicsWithDates.length > 0 ? new Date(Math.min(...epicsWithDates.map((e) => new Date(e.earliestSprintStart!).getTime()))) : new Date();
    const maxDate = epicsWithDates.length > 0 ? new Date(Math.max(...epicsWithDates.map((e) => new Date(e.latestSprintEnd!).getTime()))) : new Date();
    const totalDays = daysBetween(minDate, maxDate);

    const timelineScale = zoom === 'week' ? 120 : zoom === 'month' ? 70 : 35;

    const today = new Date();
    const todayOffsetPct = (daysBetween(minDate, today) / totalDays) * 100;
    const isTodayVisible = today >= minDate && today <= maxDate;

    return (
        <div className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-primary">Roadmap</h1>
                        <span className="rounded bg-surface-muted px-2 py-0.5 text-xs text-secondary">
                            {epicsWithDates.length} Epic
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-secondary">
                        Projenin Epic ve sprint planlamasını zaman çizelgesinde görüntüleyin.
                    </p>
                </div>
                <button type="button" className="rounded-md p-2 text-secondary hover:bg-surface-muted" title="Roadmap seçenekleri">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                    <button type="button" className="rounded-md p-2 text-secondary hover:bg-surface-muted" title="Önceki dönem">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const container = timelineRef.current;
                            if (!container) return;
                            const target = (todayOffsetPct / 100) * (container.scrollWidth - container.clientWidth);
                            container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
                        }}
                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface-muted"
                    >
                        Bugün
                    </button>
                    <button type="button" className="rounded-md p-2 text-secondary hover:bg-surface-muted" title="Sonraki dönem">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Epic ara..."
                            className="h-9 w-48 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-primary outline-none focus:border-blue-500"
                        />
                    </div>

                    <button type="button" className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-secondary hover:bg-surface-muted">
                        <Filter className="h-4 w-4" />
                        Filtre
                    </button>

                    <select
                        value={zoom}
                        onChange={(e) => setZoom(e.target.value as 'week' | 'month' | 'quarter')}
                        className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-primary outline-none"
                    >
                        <option value="week">Haftalar</option>
                        <option value="month">Aylar</option>
                        <option value="quarter">Çeyrekler</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setShowCompleted((value) => !value)}
                        className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm ${showCompleted
                                ? 'border-border bg-surface text-secondary'
                                : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                    >
                        <Settings2 className="h-4 w-4" />
                        Tamamlananlar
                    </button>
                </div>
            </div>

            {epicsWithDates.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                    <div ref={timelineRef} className="overflow-x-auto">
                        <div
                            className="relative"
                            style={{ minWidth: `${Math.max(1100, totalDays * timelineScale + 300)}px` }}
                        >
                            {/* Timeline Header */}
                            <div className="sticky top-0 z-30 flex h-16 border-b border-border bg-surface">
                                <div className="sticky left-0 z-40 flex w-72 shrink-0 items-end border-r border-border bg-surface px-4 pb-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Epic</span>
                                </div>

                                <div className="relative flex-1 flex flex-col">
                                    <div className="flex h-8 items-center border-b border-border px-3 text-xs font-semibold text-secondary bg-surface justify-between">
                                        <span>{minDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>

                                        {/* "Bugün" Etiketi (Sadece Header'da tek bir kez görünür) */}
                                        {isTodayVisible && (
                                            <div className="absolute z-50 flex items-center -translate-x-1/2" style={{ left: `${todayOffsetPct}%` }}>
                                                <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                                                    Bugün
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex h-8 items-center">
                                        {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, index) => {
                                            const date = new Date(minDate);
                                            date.setDate(date.getDate() + index * 7);
                                            return (
                                                <div key={index} className="flex-1 px-2 text-[11px] text-muted border-r border-border/40 truncate">
                                                    {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Epics List */}
                            {epicsWithDates.map((epic) => {
                                const start = new Date(epic.earliestSprintStart!);
                                const end = new Date(epic.latestSprintEnd!);
                                const offsetPct = (daysBetween(minDate, start) / totalDays) * 100;
                                const widthPct = Math.max(3, (daysBetween(start, end) / totalDays) * 100);
                                const progressPct = epic.totalTasks > 0 ? Math.round((epic.doneTasks / epic.totalTasks) * 100) : 0;
                                const epicColor = epic.color && epic.color !== '#6554C0' ? epic.color : '#2563eb'; // Varsayılan şık mavi (Blue-600)

                                return (
                                    <div key={epic.id}>
                                        <div className="flex min-h-[72px] border-b border-border hover:bg-surface-muted/40 transition-colors">
                                            <div className="sticky left-0 z-20 flex w-72 shrink-0 items-center justify-between border-r border-border bg-surface px-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <Link
                                                        to={`/tasks/${epic.id}`}
                                                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-blue-600"
                                                    >
                                                        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: epicColor }} />
                                                        <span className="truncate">{epic.title}</span>
                                                    </Link>

                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-muted">
                                                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${progressPct}%` }} />
                                                        </div>
                                                        <span className="text-[11px] text-muted">{progressPct}%</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setExpandedEpics((current) =>
                                                            current.includes(epic.id) ? current.filter((id) => id !== epic.id) : [...current, epic.id]
                                                        );
                                                    }}
                                                    className="rounded p-1 text-muted hover:bg-surface-muted hover:text-primary shrink-0"
                                                    title="Epic detaylarını aç/kapat"
                                                >
                                                    {expandedEpics.includes(epic.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                                                </button>
                                            </div>

                                            <div className="relative flex-1">
                                                <div className="absolute inset-0 flex pointer-events-none">
                                                    {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, index) => (
                                                        <div key={index} className="flex-1 border-r border-border/40" />
                                                    ))}
                                                </div>

                                                {/* Bugün Dikey Çizgisi (Tüm satırlar boyunca kesintisiz iner) */}
                                                {isTodayVisible && (
                                                    <div className="pointer-events-none absolute bottom-0 top-0 z-10" style={{ left: `${todayOffsetPct}%` }}>
                                                        <div className="h-full border-l-2 border-blue-500 opacity-80" />
                                                    </div>
                                                )}

                                                <div className="relative h-full flex items-center">
                                                    <div
                                                        className="absolute h-8 rounded-md shadow-sm transition-all flex items-center"
                                                        style={{
                                                            left: `${offsetPct}%`,
                                                            width: `${widthPct}%`,
                                                            backgroundColor: epicColor,
                                                            minWidth: '90px',
                                                        }}
                                                    >
                                                        <div
                                                            className="absolute inset-y-0 left-0 rounded-l-md bg-black/20 pointer-events-none"
                                                            style={{ width: `${progressPct}%` }}
                                                        />
                                                        <div className="relative z-10 flex w-full items-center px-3 overflow-hidden">
                                                            <span className="truncate text-xs font-medium text-white">{epic.title}</span>
                                                            <span className="ml-auto pl-2 text-[10px] text-white/80 shrink-0">{progressPct}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedEpics.includes(epic.id) && (
                                            <div className="border-b border-border bg-surface-muted/30">
                                                <div className="pl-72 px-4 py-3">
                                                    <div className="flex items-center gap-6 text-xs text-secondary">
                                                        <span>Toplam görev: <strong>{epic.totalTasks}</strong></span>
                                                        <span>Tamamlanan: <strong>{epic.doneTasks}</strong></span>
                                                        <span>İlerleme: <strong>{progressPct}%</strong></span>
                                                    </div>
                                                    <Link
                                                        to={`/tasks/${epic.id}`}
                                                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        Epic'i aç <ChevronRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {epicsWithoutDates.length > 0 && (
                <div className="mt-6 rounded-xl border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-primary">Planlanmamış Epic'ler</h2>
                            <p className="mt-0.5 text-xs text-secondary">Henüz sprint'e bağlanmamış Epic'ler</p>
                        </div>
                        <span className="rounded-full bg-surface-muted px-2 py-1 text-xs text-secondary">
                            {epicsWithoutDates.length}
                        </span>
                    </div>

                    <div className="divide-y divide-border">
                        {epicsWithoutDates.map((epic) => (
                            <Link
                                key={epic.id}
                                to={`/tasks/${epic.id}`}
                                className="flex items-center justify-between px-4 py-3 hover:bg-surface-muted/50"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: epic.color && epic.color !== '#6554C0' ? epic.color : '#2563eb' }} />
                                    <span className="truncate text-sm font-medium text-primary">{epic.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}