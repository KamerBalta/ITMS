import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    Clock3,
    AlertCircle,
    ListTodo,
    ArrowRight,
    CalendarDays,
    Activity,
    Plus,
    RotateCcw,
    SlidersHorizontal,
    Check,
} from 'lucide-react';

import { useProjectStore } from '../../store/projectStore';
import {
    useDashboardSummary,
    useWorkload,
    useVelocity,
    useBurndown,
} from '../../hooks/useDashboard';
import { useActiveSprint } from '../../hooks/useSprints';
import {
    useDashboardWidgets,
    useAddDashboardWidget,
    useRemoveDashboardWidget,
    useUpdateDashboardWidget,
    useReorderDashboardWidgets,
    useResetDashboardWidgets,
} from '../../hooks/useDashboardWidgets';

import { VelocityChart } from '../../components/VelocityChart';
import { BurndownChart } from '../../components/BurndownChart';
import { SkeletonBlock } from '../../components/Skeleton';
import { OnboardingBanner } from '../../components/OnboardingBanner';

import { WidgetFrame } from '../../components/dashboard-widgets/WidgetFrame';
import { MyOpenTasksWidget } from '../../components/dashboard-widgets/MyOpenTasksWidget';
import { RoadmapProgressWidget } from '../../components/dashboard-widgets/RoadmapProgressWidget';
import { QuickLinksWidget } from '../../components/dashboard-widgets/QuickLinksWidget';
import {
    WIDGET_LABELS,
    type WidgetType,
    type DashboardWidgetItem,
} from '../../types/dashboardWidget';

export function DashboardPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);

    // Veri sorguları
    const { data: summary, isLoading: summaryLoading } = useDashboardSummary(selectedProjectId);
    const { data: workload, isLoading: workloadLoading } = useWorkload(selectedProjectId);
    const { data: velocity, isLoading: velocityLoading } = useVelocity(selectedProjectId);
    const { activeSprint, isLoading: sprintLoading } = useActiveSprint(selectedProjectId);
    const { data: burndown, isLoading: burndownLoading } = useBurndown(activeSprint?.id ?? null);

    // Widget yönetimi
    const { data: widgets, isLoading: widgetsLoading } = useDashboardWidgets(selectedProjectId);
    const addWidget = useAddDashboardWidget(selectedProjectId ?? '');
    const removeWidget = useRemoveDashboardWidget(selectedProjectId ?? '');
    const updateWidget = useUpdateDashboardWidget(selectedProjectId ?? '');
    const reorderWidgets = useReorderDashboardWidgets(selectedProjectId ?? '');
    const resetWidgets = useResetDashboardWidgets(selectedProjectId ?? '');

    const [editMode, setEditMode] = useState(false);
    const [isPickerOpen, setPickerOpen] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    if (!selectedProjectId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-muted">Devam etmek için üstten bir proje seçin.</p>
            </div>
        );
    }

    const sortedWidgets = [...(widgets ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const usedTypes = new Set(sortedWidgets.map((w) => w.widgetType));
    const availableTypes = (Object.keys(WIDGET_LABELS) as WidgetType[]).filter(
        (t) => !usedTypes.has(t) || t === 'MyOpenTasks' || t === 'RoadmapProgress'
    );

    const handleDrop = async (targetId: string) => {
        if (!draggedId || draggedId === targetId) {
            setDragOverId(null);
            return;
        }
        const order = sortedWidgets.map((w) => w.id);
        const fromIndex = order.indexOf(draggedId);
        const toIndex = order.indexOf(targetId);
        const newOrder = [...order];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedId);
        await reorderWidgets.mutateAsync(newOrder);
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleAddWidget = async (type: WidgetType) => {
        await addWidget.mutateAsync({
            widgetType: type,
            width: type === 'MyOpenTasks' || type === 'RoadmapProgress' ? 1 : 2,
        });
        setPickerOpen(false);
    };

    const statusCards = [
        {
            key: 'toDo',
            label: 'To Do',
            value: summary?.toDoCount ?? 0,
            icon: ListTodo,
            className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
            iconClass: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        },
        {
            key: 'inProgress',
            label: 'In Progress',
            value: summary?.inProgressCount ?? 0,
            icon: Clock3,
            className: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
            iconClass: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
        },
        {
            key: 'review',
            label: 'Ready for Review',
            value: summary?.readyForReviewCount ?? 0,
            icon: Activity,
            className: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300',
            iconClass: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',
        },
        {
            key: 'qa',
            label: 'Ready for QA',
            value: summary?.readyForQACount ?? 0,
            icon: AlertCircle,
            className: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
            iconClass: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
        },
        {
            key: 'done',
            label: 'Done',
            value: summary?.doneCount ?? 0,
            icon: CheckCircle2,
            className: 'bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300',
            iconClass: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
        },
    ];

    const renderWidgetContent = (widget: DashboardWidgetItem) => {
        switch (widget.widgetType) {
            case 'StatusSummary':
                return summaryLoading || !summary ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonBlock key={i} className="h-24 w-full rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                        {statusCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={card.label}
                                    className={`rounded-lg px-4 py-4 transition-all duration-150 border border-transparent hover:shadow-sm ${card.className}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-semibold">{card.label}</span>
                                        <div
                                            className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${card.iconClass}`}
                                        >
                                            <Icon className="w-4 h-4" strokeWidth={2} />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-semibold mt-3">{card.value}</p>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'OverviewCards':
                return summaryLoading || !summary ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SkeletonBlock className="h-28 w-full rounded-lg" />
                        <SkeletonBlock className="h-28 w-full rounded-lg" />
                        <SkeletonBlock className="h-28 w-full rounded-lg" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="surface border border-slate-200 dark:border-gray-800 rounded-lg p-5">
                            <div className="flex items-center gap-2 text-muted text-sm">
                                <ListTodo className="w-4 h-4" />
                                Toplam Görev
                            </div>
                            <p className="text-3xl font-semibold text-primary mt-3">
                                {summary.totalTasks}
                            </p>
                        </div>

                        <Link
                            to="/overdue"
                            className={`border border-gray-100 dark:border-gray-800 rounded-lg p-3 block transition-colors ${summary.overdueCount > 0
                                    ? 'hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
                                    : 'hover-surface'
                                }`}
                        >
                            <p className="text-xs text-muted">Geciken Görev</p>
                            <p
                                className={`text-xl font-bold ${summary.overdueCount > 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-primary'
                                    }`}
                            >
                                {summary.overdueCount}
                            </p>
                            {summary.overdueCount > 0 && (
                                <p className="text-[10px] text-red-400 dark:text-red-500 mt-0.5">
                                    → Detayları gör
                                </p>
                            )}
                        </Link>

                        <div className="surface border border-slate-200 dark:border-gray-800 rounded-lg p-5">
                            <div className="flex items-center gap-2 text-muted text-sm">
                                <CalendarDays className="w-4 h-4" />
                                Aktif Sprint
                            </div>
                            {summary.activeSprintName ? (
                                <>
                                    <p className="text-lg font-semibold text-primary mt-2 truncate">
                                        {summary.activeSprintName}
                                    </p>
                                    <p className="text-xs text-muted mt-1">
                                        {summary.activeSprintEndDate
                                            ? `Bitiş: ${new Date(
                                                summary.activeSprintEndDate
                                            ).toLocaleDateString('tr-TR')}`
                                            : 'Bitiş tarihi yok'}{' '}
                                        · {summary.activeSprintTaskCount} görev
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted mt-3">Aktif sprint yok</p>
                            )}
                        </div>
                    </div>
                );

            case 'Burndown':
                if (!sprintLoading && !activeSprint) {
                    return (
                        <div className="p-8 text-center text-sm text-muted">
                            Aktif sprint bulunmuyor.
                        </div>
                    );
                }
                return (
                    <div>
                        {activeSprint && (
                            <div className="flex justify-end mb-2">
                                <Link
                                    to={`/sprints/${activeSprint.id}`}
                                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {burndown?.sprintName ?? activeSprint.name}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                        {burndownLoading || !burndown ? (
                            <SkeletonBlock className="h-64 w-full rounded-md" />
                        ) : (
                            <BurndownChart data={burndown} />
                        )}
                    </div>
                );

            case 'Velocity':
                return velocityLoading ? (
                    <SkeletonBlock className="h-56 w-full rounded-md" />
                ) : (
                    <VelocityChart data={velocity ?? []} />
                );

            case 'Workload':
                return workloadLoading ? (
                    <div className="space-y-3">
                        <SkeletonBlock className="h-10 w-full rounded-md" />
                        <SkeletonBlock className="h-10 w-full rounded-md" />
                        <SkeletonBlock className="h-10 w-full rounded-md" />
                    </div>
                ) : !workload || workload.length === 0 ? (
                    <p className="text-sm text-muted py-4 text-center">
                        Şu anda kimseye atanmış aktif görev yok.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {workload.map((w) => (
                            <div key={w.userId} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-semibold shrink-0">
                                        {w.userName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-primary truncate">{w.userName}</span>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-primary">{w.taskCount}</p>
                                    <p className="text-[11px] text-muted">{w.totalStoryPoints} SP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'MyOpenTasks':
                return <MyOpenTasksWidget projectId={selectedProjectId} />;
            case 'RoadmapProgress':
                return <RoadmapProgressWidget projectId={selectedProjectId} />;
            case 'QuickLinks':
                return <QuickLinksWidget />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            <OnboardingBanner />

            {/* =====================================================
                PAGE HEADER & ACTIONS
            ====================================================== */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
                    <p className="text-sm text-muted mt-1">
                        Projenizin genel durumuna göz atın ve görünümünüzü özelleştirin.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setPickerOpen(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-1.5 rounded-md transition cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Widget Ekle
                            </button>
                            <button
                                onClick={() => resetWidgets.mutate()}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-md transition cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Sıfırla
                            </button>
                            <button
                                onClick={() => setEditMode(false)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md transition shadow-sm cursor-pointer"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Tamamla
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-gray-700 surface hover-surface text-secondary hover:text-primary px-3 py-1.5 rounded-md transition cursor-pointer shadow-xs"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Özelleştir
                        </button>
                    )}
                </div>
            </div>

            {/* =====================================================
                WIDGETS GRID
            ====================================================== */}
            {widgetsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonBlock className="h-44 w-full rounded-lg" />
                    <SkeletonBlock className="h-44 w-full rounded-lg" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedWidgets.map((widget) => (
                        <WidgetFrame
                            key={widget.id}
                            title={widget.title ?? WIDGET_LABELS[widget.widgetType as WidgetType]}
                            width={widget.width}
                            editMode={editMode}
                            onRemove={() => removeWidget.mutate(widget.id)}
                            onTitleChange={(title) =>
                                updateWidget.mutate({
                                    id: widget.id,
                                    title: title || null,
                                    width: widget.width,
                                })
                            }
                            onWidthToggle={() =>
                                updateWidget.mutate({
                                    id: widget.id,
                                    title: widget.title,
                                    width: widget.width === 2 ? 1 : 2,
                                })
                            }
                            draggable={editMode}
                            onDragStart={() => setDraggedId(widget.id)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverId(widget.id);
                            }}
                            onDrop={() => handleDrop(widget.id)}
                            isDragOver={dragOverId === widget.id}
                        >
                            {renderWidgetContent(widget)}
                        </WidgetFrame>
                    ))}
                </div>
            )}

            {/* =====================================================
                WIDGET PICKER MODAL
            ====================================================== */}
            {isPickerOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => setPickerOpen(false)}
                >
                    <div
                        className="surface border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl p-5 w-full max-w-sm space-y-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <p className="text-sm font-semibold text-primary">Yeni Widget Ekle</p>
                            <p className="text-xs text-muted mt-0.5">
                                Panonuzda görmek istediğiniz bileşeni seçin.
                            </p>
                        </div>

                        <div className="space-y-1.5 max-h-64 overflow-y-auto pt-1">
                            {availableTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => handleAddWidget(type)}
                                    className="w-full text-left text-sm px-3.5 py-2.5 rounded-lg hover-surface text-secondary hover:text-primary transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-gray-700"
                                >
                                    <span>{WIDGET_LABELS[type]}</span>
                                    <Plus className="w-4 h-4 text-muted group-hover:text-primary transition-transform group-hover:scale-110" />
                                </button>
                            ))}
                            {availableTypes.length === 0 && (
                                <p className="text-xs text-muted text-center py-4">
                                    Tüm widget türleri panonuza eklenmiş.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-gray-800">
                            <button
                                onClick={() => setPickerOpen(false)}
                                className="text-xs text-secondary hover:text-primary px-3 py-1.5 rounded-md hover-surface cursor-pointer"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}