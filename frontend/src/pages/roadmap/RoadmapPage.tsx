import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useRoadmap } from '../../hooks/useRoadmap';
import { Lock, Ban, GitBranch } from 'lucide-react';

function daysBetween(a: Date, b: Date) {
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

const taskDetailUrl = (issueKey: string) => `/browse/${issueKey}`;

export function RoadmapPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const { data, isLoading } = useRoadmap(selectedProjectId);
    const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [arrowPaths, setArrowPaths] = useState<{ from: string; to: string; d: string }[]>([]);

    const epics = data?.epics ?? [];
    const dependencies = data?.dependencies ?? [];
    const epicsWithDates = epics.filter((e) => e.earliestSprintStart && e.latestSprintEnd);

    // Bağımlılık oklarının gerçek piksel koordinatlarını hesapla
    useEffect(() => {
        if (!containerRef.current || dependencies.length === 0) {
            setArrowPaths([]);
            return;
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        const paths = dependencies
            .map((dep) => {
                const fromEl = rowRefs.current[dep.fromEpicId];
                const toEl = rowRefs.current[dep.toEpicId];
                if (!fromEl || !toEl) return null;

                const fromRect = fromEl.getBoundingClientRect();
                const toRect = toEl.getBoundingClientRect();

                const x1 = fromRect.right - containerRect.left;
                const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
                const x2 = toRect.left - containerRect.left;
                const y2 = toRect.top + toRect.height / 2 - containerRect.top;

                const midX = (x1 + x2) / 2;
                const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                return { from: dep.fromEpicId, to: dep.toEpicId, d };
            })
            .filter((p): p is { from: string; to: string; d: string } => p !== null);

        setArrowPaths(paths);
    }, [dependencies, epicsWithDates.length]);

    if (!selectedProjectId) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center bg-[#f7f8fa] px-5 dark:bg-gray-950">
                <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Proje seçilmedi
                    </div>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Roadmap'i görüntülemek için üstten bir proje seçin.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fa] dark:bg-gray-950">
                <div className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 sm:px-5">
                        <div className="min-w-0">
                            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                Roadmap
                            </h1>
                            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                Timeline yükleniyor...
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Roadmap yükleniyor...
                    </div>
                </div>
            </div>
        );
    }

    const minDate = epicsWithDates.length > 0 ? new Date(Math.min(...epicsWithDates.map((e) => new Date(e.earliestSprintStart!).getTime()))) : null;
    const maxDate = epicsWithDates.length > 0 ? new Date(Math.max(...epicsWithDates.map((e) => new Date(e.latestSprintEnd!).getTime()))) : null;
    const totalDays = minDate && maxDate ? daysBetween(minDate, maxDate) : 1;

    if (epicsWithDates.length === 0) {
        return (
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fa] dark:bg-gray-950">
                <div className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 sm:px-5">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    Roadmap
                                </h1>

                                <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    Timeline
                                </span>
                            </div>

                            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                Sprint'e bağlanmış Epic bulunmuyor.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center px-5">
                    <div className="max-w-lg rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            Roadmap için henüz veri yok
                        </div>

                        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                            Sprint'e bağlanmış görevleri olan bir Epic olduğunda
                            roadmap otomatik olarak oluşturulacaktır.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fa] dark:bg-gray-950">
            {/* Jira Kompakt Header */}
            <div className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 sm:px-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                                Roadmap
                            </h1>

                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                Timeline
                            </span>
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                            <span>
                                {minDate?.toLocaleDateString('tr-TR')} — {maxDate?.toLocaleDateString('tr-TR')}
                            </span>

                            {dependencies.length > 0 && (
                                <span className="inline-flex items-center gap-1">
                                    <GitBranch size={12} />
                                    {dependencies.length} bağımlılık
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {epicsWithDates.length} Epic
                        </span>
                    </div>
                </div>
            </div>

            {/* Timeline Scroll Workspace */}
            <div className="min-h-0 flex-1 overflow-auto">
                <div className="min-w-max bg-white dark:bg-gray-900">
                    <div ref={containerRef} className="relative min-w-[980px]">
                        {/* Timeline Header (3 Kolon & Kılavuz Çizgileri) */}
                        <div className="grid grid-cols-[240px_minmax(720px,1fr)_36px] border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/70">
                            <div className="border-r border-gray-200 px-4 py-2.5 text-[11px] font-semibold text-gray-500 dark:border-gray-800 dark:text-gray-400">
                                Epic
                            </div>

                            <div className="relative px-4 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                Timeline
                                <div className="absolute inset-y-0 left-0 right-0 pointer-events-none">
                                    <div className="absolute left-[25%] top-0 bottom-0 border-l border-gray-200 dark:border-gray-800" />
                                    <div className="absolute left-[50%] top-0 bottom-0 border-l border-gray-200 dark:border-gray-800" />
                                    <div className="absolute left-[75%] top-0 bottom-0 border-l border-gray-200 dark:border-gray-800" />
                                </div>
                            </div>

                            <div />
                        </div>

                        {/* SVG Bağımlılık Okları */}
                        {arrowPaths.length > 0 && (
                            <svg
                                className="pointer-events-none absolute inset-0 z-20"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'visible',
                                }}
                            >
                                <defs>
                                    <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                        <path d="M0,0 L6,3 L0,6 Z" className="fill-gray-400 dark:fill-gray-500" />
                                    </marker>
                                </defs>
                                {arrowPaths.map((p, i) => (
                                    <path
                                        key={i}
                                        d={p.d}
                                        fill="none"
                                        className="stroke-gray-400 dark:stroke-gray-500"
                                        strokeWidth="1.25"
                                        strokeDasharray="5 3"
                                        markerEnd="url(#arrowhead)"
                                    />
                                ))}
                            </svg>
                        )}

                        {/* Epic Satırları */}
                        {epicsWithDates.map((epic) => {
                            const start = new Date(epic.earliestSprintStart!);
                            const end = new Date(epic.latestSprintEnd!);
                            const offsetPct = minDate ? (daysBetween(minDate, start) / totalDays) * 100 : 0;
                            const widthPct = Math.max(2, (daysBetween(start, end) / totalDays) * 100);
                            const progressPct = epic.totalTasks > 0 ? Math.round((epic.doneTasks / epic.totalTasks) * 100) : 0;
                            const isBlocked = dependencies.some((d) => d.toEpicId === epic.id);
                            const isBlocking = dependencies.some((d) => d.fromEpicId === epic.id);

                            return (
                                <div
                                    key={epic.id}
                                    ref={(el) => {
                                        rowRefs.current[epic.id] = el;
                                    }}
                                    className="group relative grid min-h-[44px] grid-cols-[240px_minmax(720px,1fr)_36px] items-center border-b border-gray-100 dark:border-gray-800"
                                >
                                    {/* 1. Kolon: Epic Bilgisi */}
                                    <Link
                                        to={taskDetailUrl(epic.issueKey)}
                                        className="flex min-w-0 items-center gap-2 border-r border-gray-100 px-3 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-800/60"
                                        title={`${epic.issueKey ? `${epic.issueKey} — ` : ''}${epic.title}`}
                                    >
                                        {isBlocked && (
                                            <span
                                                title="Bu Epic başka bir Epic tarafından engelleniyor"
                                                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                                            >
                                                <Lock size={12} />
                                            </span>
                                        )}
                                        <span className="shrink-0 font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                            {epic.issueKey}
                                        </span>
                                        <span className="truncate text-[13px] font-medium text-gray-800 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                                            {epic.title}
                                        </span>
                                    </Link>

                                    {/* 2. Kolon: Timeline Izgarası ve Barı */}
                                    <div
                                        className="relative flex h-8 items-center overflow-hidden bg-white dark:bg-gray-900"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(to right, rgba(148,163,184,0.10) 1px, transparent 1px)',
                                            backgroundSize: '80px 100%',
                                        }}
                                    >
                                        <div
                                            className="absolute top-1.5 flex h-5 items-center overflow-hidden rounded px-2 shadow-none ring-1 ring-black/10 transition-shadow group-hover:shadow-sm"
                                            style={{
                                                left: `${offsetPct}%`,
                                                width: `${widthPct}%`,
                                                backgroundColor: epic.color ?? '#c7d2fe',
                                            }}
                                        >
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-l bg-black/15"
                                                style={{ width: `${progressPct}%` }}
                                            />
                                            <span className="relative z-10 whitespace-nowrap text-[10px] font-medium text-white">
                                                {epic.doneTasks}/{epic.totalTasks} · {progressPct}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* 3. Kolon: Engelliyor (isBlocking) İkon Alanı */}
                                    <div className="flex items-center justify-center">
                                        {isBlocking && (
                                            <span
                                                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                                                title="Bu Epic başka bir Epic'i engelliyor"
                                            >
                                                <Ban size={12} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend (Yardımcı Açıklama) */}
                {dependencies.length > 0 && (
                    <div className="mx-3 mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-200 px-1 pt-3 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:mx-5">
                        <span className="inline-flex items-center gap-1.5">
                            <Lock size={12} className="text-amber-500" />
                            Engelleniyor
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                            <Ban size={12} className="text-rose-500" />
                            Engelliyor
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-px w-5 border-t border-dashed border-gray-400" />
                            Bağımlılık akışı
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}