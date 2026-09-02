import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useRoadmap } from '../../hooks/useRoadmap';

function daysBetween(a: Date, b: Date) {
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export function RoadmapPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const { data, isLoading } = useRoadmap(selectedProjectId);
    const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [arrowPaths, setArrowPaths] = useState<{ from: string; to: string; d: string }[]>([]);

    const epics = data?.epics ?? [];
    const dependencies = data?.dependencies ?? [];
    const epicsWithDates = epics.filter((e) => e.earliestSprintStart && e.latestSprintEnd);
    const epicsWithoutDates = epics.filter((e) => !e.earliestSprintStart || !e.latestSprintEnd);

    // #1: Bagimlilik oklarinin gercek piksel koordinatlarini hesapla
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

    // Erken dönüşler (Early returns) Hook tanımlamalarından SONRA yapılmalıdır
    if (!selectedProjectId) return <p className="text-muted">Devam etmek için üstten bir proje seçin.</p>;
    if (isLoading) return <p className="text-muted">Yükleniyor...</p>;

    const minDate = epicsWithDates.length > 0 ? new Date(Math.min(...epicsWithDates.map((e) => new Date(e.earliestSprintStart!).getTime()))) : null;
    const maxDate = epicsWithDates.length > 0 ? new Date(Math.max(...epicsWithDates.map((e) => new Date(e.latestSprintEnd!).getTime()))) : null;
    const totalDays = minDate && maxDate ? daysBetween(minDate, maxDate) : 1;

    if (epicsWithDates.length === 0) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-primary">Roadmap</h1>
                <p className="text-sm text-muted">
                    Henüz sprint'e bağlanmış görevleri olan bir Epic yok. Roadmap, Epic'lerin alt görevlerinin sprint
                    tarihlerine göre otomatik oluşturulur.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-primary">Roadmap</h1>
                <p className="text-sm text-muted">
                    {minDate?.toLocaleDateString('tr-TR')} — {maxDate?.toLocaleDateString('tr-TR')}
                    {dependencies.length > 0 && <span> · {dependencies.length} bağımlılık</span>}
                </p>
            </div>

            <div className="surface border rounded-lg p-4 overflow-x-auto">
                <div ref={containerRef} className="relative min-w-[600px] space-y-3">
                    {/* #1: Bagimlilik oklari, tum satirlarin USTUNDE, absolute pozisyonlu bir SVG katmani */}
                    {arrowPaths.length > 0 && (
                        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                            <defs>
                                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                                    <path d="M0,0 L8,4 L0,8 Z" className="fill-red-400 dark:fill-red-500" />
                                </marker>
                            </defs>
                            {arrowPaths.map((p, i) => (
                                <path
                                    key={i}
                                    d={p.d}
                                    fill="none"
                                    className="stroke-red-400 dark:stroke-red-500"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 3"
                                    markerEnd="url(#arrowhead)"
                                />
                            ))}
                        </svg>
                    )}

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
                                className="flex items-center gap-3 relative"
                            >
                                <Link to={`/tasks/${epic.id}`} className="w-40 shrink-0 text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate flex items-center gap-1">
                                    {isBlocked && <span title="Bu Epic başka bir Epic tarafından engelleniyor">🔒</span>}
                                    {epic.title}
                                </Link>
                                <div className="flex-1 relative h-6 bg-gray-50 dark:bg-gray-900 rounded">
                                    <div
                                        className="absolute top-0 h-6 rounded flex items-center px-2 overflow-hidden"
                                        style={{ left: `${offsetPct}%`, width: `${widthPct}%`, backgroundColor: epic.color ?? '#c7d2fe' }}
                                    >
                                        <div className="absolute top-0 left-0 h-full bg-black/20 rounded-l" style={{ width: `${progressPct}%` }} />
                                        <span className="text-[10px] text-white font-medium relative z-10 whitespace-nowrap">
                                            {epic.doneTasks}/{epic.totalTasks} ({progressPct}%)
                                        </span>
                                    </div>
                                </div>
                                {isBlocking && <span className="text-xs text-muted shrink-0" title="Bu Epic başka bir Epic'i engelliyor">⛔</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {dependencies.length > 0 && (
                <p className="text-xs text-muted">🔒 = başka bir Epic tarafından engelleniyor · ⛔ = başka bir Epic'i engelliyor (kırmızı kesikli çizgi: bağımlılık yönü)</p>
            )}

            {epicsWithoutDates.length > 0 && (
                <div>
                    <p className="text-sm text-muted mb-2">Sprint'e bağlanmamış Epic'ler</p>
                    <div className="flex flex-wrap gap-2">
                        {epicsWithoutDates.map((e) => (
                            <Link key={e.id} to={`/tasks/${e.id}`} className="text-xs bg-gray-100 dark:bg-gray-700 text-secondary px-2 py-1 rounded-full hover:underline">
                                {e.title}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}