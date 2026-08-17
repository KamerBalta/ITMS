import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    Clock3,
    AlertCircle,
    ListTodo,
    ArrowRight,
    Users,
    CalendarDays,
    Activity,
} from 'lucide-react';

import { useProjectStore } from '../../store/projectStore';
import {
    useDashboardSummary,
    useWorkload,
    useVelocity,
    useBurndown,
} from '../../hooks/useDashboard';
import { useActiveSprint } from '../../hooks/useSprints';

import { VelocityChart } from '../../components/VelocityChart';
import { BurndownChart } from '../../components/BurndownChart';

export function DashboardPage() {
    const selectedProjectId = useProjectStore(
        (state) => state.selectedProjectId
    );

    const {
        data: summary,
        isLoading: summaryLoading,
    } = useDashboardSummary(selectedProjectId);

    const {
        data: workload,
        isLoading: workloadLoading,
    } = useWorkload(selectedProjectId);

    const { data: velocity } =
        useVelocity(selectedProjectId);

    const { activeSprint } =
        useActiveSprint(selectedProjectId);

    const { data: burndown } =
        useBurndown(activeSprint?.id ?? null);

    const [showVelocity, setShowVelocity] =
        useState(true);

    if (!selectedProjectId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-muted">
                    Devam etmek için üstten bir proje seçin.
                </p>
            </div>
        );
    }

    if (summaryLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-muted">
                    Dashboard yükleniyor...
                </p>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-red-500">
                    Dashboard verisi alınamadı.
                </p>
            </div>
        );
    }

    const statusCards = [
        {
            key: 'toDo',
            label: 'To Do',
            value: summary.toDoCount,
            icon: ListTodo,
            className:
                'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
            iconClass:
                'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        },
        {
            key: 'inProgress',
            label: 'In Progress',
            value: summary.inProgressCount,
            icon: Clock3,
            className:
                'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
            iconClass:
                'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
        },
        {
            key: 'review',
            label: 'Ready for Review',
            value: summary.readyForReviewCount,
            icon: Activity,
            className:
                'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300',
            iconClass:
                'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',
        },
        {
            key: 'qa',
            label: 'Ready for QA',
            value: summary.readyForQACount,
            icon: AlertCircle,
            className:
                'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
            iconClass:
                'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
        },
        {
            key: 'done',
            label: 'Done',
            value: summary.doneCount,
            icon: CheckCircle2,
            className:
                'bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300',
            iconClass:
                'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
        },
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="flex items-start justify-between gap-4">

                <div>
                    <h1 className="text-2xl font-semibold text-primary">
                        Dashboard
                    </h1>

                    <p className="text-sm text-muted mt-1">
                        Projenizin genel durumuna hızlıca göz atın.
                    </p>
                </div>

                {activeSprint && (
                    <Link
                        to={`/sprints/${activeSprint.id}`}
                        className="
                            hidden
                            sm:flex
                            items-center
                            gap-1.5
                            text-sm
                            text-blue-600
                            dark:text-blue-400
                            hover:underline
                        "
                    >
                        Sprint detayları
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            {/* =====================================================
                STATUS SUMMARY
            ====================================================== */}

            <div className="
                grid
                grid-cols-2
                md:grid-cols-3
                xl:grid-cols-5
                gap-3
            ">
                {statusCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.label}
                            className={`
                                rounded-lg
                                px-4
                                py-4
                                transition-all
                                duration-150
                                border
                                border-transparent
                                hover:shadow-sm
                                ${card.className}
                            `}
                        >
                            <div className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            ">
                                <span className="
                                    text-xs
                                    font-semibold
                                ">
                                    {card.label}
                                </span>

                                <div
                                    className={`
                                        w-8
                                        h-8
                                        rounded-md
                                        flex
                                        items-center
                                        justify-center
                                        shrink-0
                                        ${card.iconClass}
                                    `}
                                >
                                    <Icon
                                        className="w-4 h-4"
                                        strokeWidth={2}
                                    />
                                </div>
                            </div>

                            <p className="
                                text-2xl
                                font-semibold
                                mt-3
                            ">
                                {card.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* =====================================================
                PROJECT OVERVIEW
            ====================================================== */}

            <div className="
                grid
                grid-cols-1
                lg:grid-cols-3
                gap-4
            ">

                {/* Total Tasks */}

                <div className="
                    surface
                    border
                    border-slate-200
                    dark:border-gray-800
                    rounded-lg
                    p-5
                ">
                    <div className="
                        flex
                        items-center
                        gap-2
                        text-muted
                        text-sm
                    ">
                        <ListTodo className="w-4 h-4" />
                        Toplam Görev
                    </div>

                    <p className="
                        text-3xl
                        font-semibold
                        text-primary
                        mt-3
                    ">
                        {summary.totalTasks}
                    </p>
                </div>

                {/* Overdue */}

                <div className="
                    surface
                    border
                    border-slate-200
                    dark:border-gray-800
                    rounded-lg
                    p-5
                ">
                    <div className="
                        flex
                        items-center
                        gap-2
                        text-muted
                        text-sm
                    ">
                        <AlertCircle className="w-4 h-4" />
                        Geciken Görev
                    </div>

                    <p
                        className={`
                            text-3xl
                            font-semibold
                            mt-3
                            ${summary.overdueCount > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-primary'
                            }
                        `}
                    >
                        {summary.overdueCount}
                    </p>
                </div>

                {/* Active Sprint */}

                <div className="
                    surface
                    border
                    border-slate-200
                    dark:border-gray-800
                    rounded-lg
                    p-5
                ">
                    <div className="
                        flex
                        items-center
                        gap-2
                        text-muted
                        text-sm
                    ">
                        <CalendarDays className="w-4 h-4" />
                        Aktif Sprint
                    </div>

                    {summary.activeSprintName ? (
                        <>
                            <p className="
                                text-lg
                                font-semibold
                                text-primary
                                mt-2
                                truncate
                            ">
                                {summary.activeSprintName}
                            </p>

                            <p className="
                                text-xs
                                text-muted
                                mt-1
                            ">
                                {summary.activeSprintEndDate
                                    ? `Bitiş: ${new Date(
                                        summary.activeSprintEndDate
                                    ).toLocaleDateString(
                                        'tr-TR'
                                    )}`
                                    : 'Bitiş tarihi yok'}
                                {' · '}
                                {summary.activeSprintTaskCount}{' '}
                                görev
                            </p>
                        </>
                    ) : (
                        <p className="
                            text-sm
                            text-muted
                            mt-3
                        ">
                            Aktif sprint yok
                        </p>
                    )}
                </div>
            </div>

            {/* =====================================================
                BURNDOWN
            ====================================================== */}

            {burndown && (
                <section className="
                    surface
                    border
                    border-slate-200
                    dark:border-gray-800
                    rounded-lg
                    overflow-hidden
                ">
                    <div className="
                        px-5
                        py-4
                        border-b
                        border-slate-200
                        dark:border-gray-800
                        flex
                        items-center
                        justify-between
                    ">
                        <div>
                            <h2 className="
                                text-sm
                                font-semibold
                                text-primary
                            ">
                                Burndown
                            </h2>

                            <p className="
                                text-xs
                                text-muted
                                mt-0.5
                            ">
                                Sprint ilerlemesi
                            </p>
                        </div>

                        <Link
                            to={`/sprints/${activeSprint?.id}`}
                            className="
                                flex
                                items-center
                                gap-1
                                text-xs
                                text-blue-600
                                dark:text-blue-400
                                hover:underline
                            "
                        >
                            {burndown.sprintName}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="p-5">
                        <BurndownChart data={burndown} />
                    </div>
                </section>
            )}

            {/* =====================================================
                VELOCITY + WORKLOAD
            ====================================================== */}

            <div className="
                grid
                grid-cols-1
                xl:grid-cols-5
                gap-4
            ">

                {/* Velocity */}

                <section className="
                    xl:col-span-3
                    surface
                    border
                    border-slate-200
                    dark:border-gray-800
                    rounded-lg
                    overflow-hidden
                ">
                    <div className="
                        px-5
                        py-4
                        border-b
                        border-slate-200
                        dark:border-gray-800
                        flex
                        items-center
                        justify-between
                    ">
                        <div>
                            <h2 className="
                                text-sm
                                font-semibold
                                text-primary
                            ">
                                Velocity
                            </h2>

                            <p className="
                                text-xs
                                text-muted
                                mt-0.5
                            ">
                                Tamamlanan sprintler
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                setShowVelocity(
                                    (v) => !v
                                )
                            }
                            className="
                                text-xs
                                text-secondary
                                hover:text-primary
                            "
                        >
                            {showVelocity
                                ? 'Gizle'
                                : 'Göster'}
                        </button>
                    </div>

                    {showVelocity && (
                        <div className="p-5">
                            <VelocityChart
                                data={velocity ?? []}
                            />
                        </div>
                    )}
                </section>

                {/* Workload */}

                <section className="
                    xl:col-span-2
                    surface
                    border
                    border-slate-200
                    dark:border-gray-800
                    rounded-lg
                    overflow-hidden
                ">
                    <div className="
                        px-5
                        py-4
                        border-b
                        border-slate-200
                        dark:border-gray-800
                        flex
                        items-center
                        gap-2
                    ">
                        <Users className="w-4 h-4 text-muted" />

                        <div>
                            <h2 className="
                                text-sm
                                font-semibold
                                text-primary
                            ">
                                Takım İş Yükü
                            </h2>

                            <p className="
                                text-xs
                                text-muted
                                mt-0.5
                            ">
                                Açık görevler
                            </p>
                        </div>
                    </div>

                    <div className="p-5">

                        {workloadLoading ? (
                            <p className="
                                text-sm
                                text-muted
                            ">
                                Yükleniyor...
                            </p>
                        ) : !workload ||
                            workload.length === 0 ? (
                            <p className="
                                text-sm
                                text-muted
                            ">
                                Şu anda kimseye atanmış aktif görev yok.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {workload.map((w) => (
                                    <div
                                        key={w.userId}
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-3
                                        "
                                    >
                                        <div className="
                                            flex
                                            items-center
                                            gap-3
                                            min-w-0
                                        ">
                                            <div className="
                                                w-8
                                                h-8
                                                rounded-full
                                                bg-blue-100
                                                dark:bg-blue-950
                                                text-blue-700
                                                dark:text-blue-300
                                                flex
                                                items-center
                                                justify-center
                                                text-xs
                                                font-semibold
                                                shrink-0
                                            ">
                                                {w.userName
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>

                                            <span className="
                                                text-sm
                                                text-primary
                                                truncate
                                            ">
                                                {w.userName}
                                            </span>
                                        </div>

                                        <div className="
                                            text-right
                                            shrink-0
                                        ">
                                            <p className="
                                                text-sm
                                                font-semibold
                                                text-primary
                                            ">
                                                {w.taskCount}
                                            </p>

                                            <p className="
                                                text-[11px]
                                                text-muted
                                            ">
                                                {w.totalStoryPoints} SP
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}