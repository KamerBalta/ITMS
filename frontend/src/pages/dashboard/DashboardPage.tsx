import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import {
    useDashboardSummary,
    useWorkload,
    useVelocity,
    useBurndown
} from '../../hooks/useDashboard';
import { useActiveSprint } from '../../hooks/useSprints';
import { VelocityChart } from '../../components/VelocityChart';
import { BurndownChart } from '../../components/BurndownChart';
import { Clock, RotateCcw, RefreshCw, Users } from 'lucide-react';

// Görseldeki tam durum renkleri ve etiketleri
const STATUS_COLORS: Record<string, string> = {
    toDoCount: 'bg-slate-100 text-slate-700 border-slate-200',
    inProgressCount: 'bg-blue-50 text-blue-700 border-blue-200',
    readyForReviewCount: 'bg-amber-50 text-amber-700 border-amber-200',
    readyForQACount: 'bg-purple-50 text-purple-700 border-purple-200',
    doneCount: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_LABELS: Record<string, string> = {
    toDoCount: 'TO DO',
    inProgressCount: 'IN PROGRESS',
    readyForReviewCount: 'READY FOR REVIEW',
    readyForQACount: 'READY FOR QA',
    doneCount: 'DONE',
};

export function DashboardPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useDashboardSummary(selectedProjectId);
    const { data: workload, isLoading: workloadLoading } = useWorkload(selectedProjectId);
    const { data: velocity } = useVelocity(selectedProjectId);
    const { activeSprint } = useActiveSprint(selectedProjectId);
    const { data: burndown } = useBurndown(activeSprint?.id ?? null);

    const [lastUpdated] = useState<string>(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));

    if (!selectedProjectId) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500 text-sm">
                Devam etmek için üst gezinti çubuğundan bir proje seçin.
            </div>
        );
    }

    if (summaryLoading) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-500 text-sm gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                Dashboard yükleniyor...
            </div>
        );
    }

    if (!summary) {
        return <p className="text-red-500 text-sm">Dashboard verisi alınamadı.</p>;
    }

    const statusKeys = ['toDoCount', 'inProgressCount', 'readyForReviewCount', 'readyForQACount', 'doneCount'] as const;

    // En yüksek SP değerini bulma (Workload Progress Bar için)
    const maxSP = workload && workload.length > 0 ? Math.max(...workload.map((w) => w.totalStoryPoints || 1)) : 1;

    return (
        <div className="space-y-6 px-1 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <p className="text-sm text-gray-400">Size atanmış görevlerin özeti</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Son güncelleme: {lastUpdated}
                    </p>
                </div>

                <button
                    onClick={() => refetchSummary()}
                    className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition text-xs flex items-center gap-1.5 font-medium shadow-2xs self-start sm:self-auto"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Yenile
                </button>
            </div>

            {/* 1. GÖRSELDEN BİREBİR KORUNAN: Durum Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statusKeys.map((key) => (
                    <div key={key} className={`rounded-xl p-4 border transition-shadow shadow-xs hover:shadow-md ${STATUS_COLORS[key]}`}>
                        <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase">{STATUS_LABELS[key]}</p>
                        <p className="text-2xl sm:text-3xl font-extrabold mt-2">{summary[key]}</p>
                    </div>
                ))}
            </div>

            {/* 2. GÖRSELDEN BİREBİR KORUNAN: Genel Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Toplam Görev */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TOPLAM GÖREV</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{summary.totalTasks}</p>
                </div>

                {/* Geciken Görev */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GECİKEN GÖREV</p>
                    <p className={`text-3xl font-bold mt-2 ${summary.overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {summary.overdueCount}
                    </p>
                </div>

                {/* Aktif Sprint */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AKTİF SPRİNT</p>
                    {summary.activeSprintName ? (
                        <div className="mt-2">
                            <p className="text-lg font-bold text-slate-900 truncate">{summary.activeSprintName}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Bitiş: {summary.activeSprintEndDate ? new Date(summary.activeSprintEndDate).toLocaleDateString('tr-TR') : '-'}
                                {' · '}
                                <strong className="text-slate-700">{summary.activeSprintTaskCount}</strong> görev
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 mt-2 italic">Aktif sprint yok</p>
                    )}
                </div>
            </div>

            {/* 3. Yan Yana Grafikler (Burndown & Velocity) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Burndown Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                            Burndown Chart —{' '}
                            {burndown && (
                                <Link to={`/sprints/${activeSprint?.id}`} className="text-indigo-600 hover:underline">
                                    {burndown.sprintName}
                                </Link>
                            )}
                        </h2>
                    </div>
                    {burndown ? (
                        <div className="overflow-x-auto">
                            <BurndownChart data={burndown} />
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-xs italic">
                            Aktif sprint için burndown verisi bulunamadı.
                        </div>
                    )}
                </div>

                {/* Velocity Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Velocity Chart</h2>
                            <p className="text-[11px] text-slate-400">Tamamlanan sprint'lerin story point metrikleri</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <VelocityChart data={velocity ?? []} />
                    </div>
                </div>
            </div>

            {/* 4. Takım İş Yükü (Görsel İlerleme Çubuklu) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        Takım İş Yükü
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">Kullanıcı Başına Story Point</span>
                </div>

                {workloadLoading ? (
                    <p className="text-xs text-slate-400 p-4 text-center">Yükleniyor...</p>
                ) : !workload || workload.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-4 text-center">Şu anda kimseye atanmış aktif görev yok.</p>
                ) : (
                    <div className="space-y-4">
                        {workload.map((w) => {
                            const initial = w.userName ? w.userName.charAt(0).toUpperCase() : 'U';
                            const percentage = Math.min(100, Math.round((w.totalStoryPoints / maxSP) * 100));

                            return (
                                <div key={w.userId} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] border border-indigo-200 shrink-0">
                                                {initial}
                                            </div>
                                            <span className="font-semibold text-slate-800">{w.userName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500 font-medium">
                                            <span>{w.taskCount} açık görev</span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                                                {w.totalStoryPoints} SP
                                            </span>
                                        </div>
                                    </div>

                                    {/* Workload Progress Bar */}
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}