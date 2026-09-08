import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useSprints, useCompleteSprint, useUpdateSprint } from '../../hooks/useSprints';
import { useTasks } from '../../hooks/useTasks';
import { useBurndown } from '../../hooks/useDashboard';
import { useAuthStore } from '../../store/authStore';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { BurndownChart } from '../../components/BurndownChart';
import { TaskCard } from '../../components/TaskCard';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Layers,
    MoreHorizontal,
    Search,
    TrendingUp,
    UserCheck,
    Activity,
    Plus,
    Pencil,
} from 'lucide-react';

const STATUS_ORDER = ['ToDo', 'InProgress', 'ReadyForReview', 'ReadyForQA', 'Done', 'Closed'];

const STATUS_LABELS: Record<string, string> = {
    ToDo: 'To Do',
    InProgress: 'In Progress',
    ReadyForReview: 'Ready for Review',
    ReadyForQA: 'Ready for QA',
    Done: 'Done',
    Closed: 'Closed',
};

const STATUS_STYLES: Record<string, string> = {
    ToDo: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    InProgress: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    ReadyForReview: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    ReadyForQA: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    Done: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    Closed: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600',
};

export function SprintDetailPage() {
    const { sprintId } = useParams<{ sprintId: string }>();
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const user = useAuthStore((state) => state.user);
    const isPM = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const { data: sprints } = useSprints(selectedProjectId);
    const sprint = sprints?.find((s) => s.id === sprintId);

    const { data: tasks, isLoading: tasksLoading } = useTasks(selectedProjectId, { sprintId });
    const { data: burndown } = useBurndown(sprintId ?? null);
    const completeSprint = useCompleteSprint(selectedProjectId ?? '');
    const updateSprint = useUpdateSprint(selectedProjectId ?? '');

    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    // Düzenleme State'leri
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
    const [editError, setEditError] = useState<string | null>(null);

    // Filtre State'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'me' | 'unassigned'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Tüm Hook ve useMemo çağrıları Early Return'lerden ÖNCE çalıştırılır
    const allTasks = useMemo(() => tasks ?? [], [tasks]);

    const filteredTasks = useMemo(() => {
        return allTasks.filter((t) => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesAssignee = true;
            if (assigneeFilter === 'me') {
                matchesAssignee = t.assigneeId === user?.userId;
            } else if (assigneeFilter === 'unassigned') {
                matchesAssignee = !t.assigneeId;
            }

            const matchesType =
                typeFilter === 'all' || t.issueType.toLowerCase() === typeFilter.toLowerCase();

            const matchesPriority =
                priorityFilter === 'all' || String(t.priority).toLowerCase() === priorityFilter.toLowerCase();

            return matchesSearch && matchesAssignee && matchesType && matchesPriority;
        });
    }, [allTasks, searchQuery, assigneeFilter, typeFilter, priorityFilter, user?.userId]);

    const tasksByStatus = useMemo(() => {
        return STATUS_ORDER.map((statusKey) => ({
            status: statusKey,
            label: STATUS_LABELS[statusKey] ?? statusKey,
            tasks: filteredTasks.filter((t) => t.status === statusKey || t.statusId === statusKey),
        })).filter((group) => group.tasks.length > 0);
    }, [filteredTasks]);

    // Koşullu Erken Dönüşler (Early Returns)
    if (!selectedProjectId) {
        return <p className="text-secondary text-sm p-4">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (!sprint) {
        return (
            <div className="space-y-3 p-4 surface border rounded-xl">
                <p className="text-secondary text-sm">Sprint bulunamadı ya da seçili projeye ait değil.</p>
                <Link to="/backlog" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    <ArrowLeft size={14} />
                    <span>Backlog'a dön</span>
                </Link>
            </div>
        );
    }

    const startEditing = () => {
        setEditForm({
            name: sprint.name,
            goal: sprint.goal ?? '',
            startDate: sprint.startDate.slice(0, 10),
            endDate: sprint.endDate.slice(0, 10),
        });
        setIsEditing(true);
        setEditError(null);
    };

    const handleSaveEdit = async () => {
        setEditError(null);
        try {
            await updateSprint.mutateAsync({
                sprintId: sprint.id,
                data: {
                    name: editForm.name,
                    goal: editForm.goal || undefined,
                    startDate: editForm.startDate,
                    endDate: editForm.endDate,
                },
            });
            setIsEditing(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setEditError(axiosError.response?.data?.message ?? 'Güncellenemedi.');
        }
    };

    const handleComplete = async () => {
        if (!sprint) return;
        const ok = await confirm(
            "Sprint'i Tamamla",
            `"${sprint.name}" sprintini tamamlamak istediğinize emin misiniz? Tamamlanmamış görevler Backlog'a geri dönecek.`,
            true
        );
        if (!ok) return;
        await completeSprint.mutateAsync(sprint.id);
        setIsMenuOpen(false);
    };

    // İlerleme ve Metrik Hesapları
    const completedTasks = allTasks.filter((t) => t.status === 'Done' || t.status === 'Closed');
    const progressPercent = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

    const totalStoryPoints = sprint.totalStoryPoints ?? allTasks.reduce((acc, t) => acc + (t.storyPoint ?? 0), 0);
    const completedStoryPoints = completedTasks.reduce((acc, t) => acc + (t.storyPoint ?? 0), 0);
    const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

    const uniqueAssigneesCount = new Set(allTasks.map((t) => t.assigneeId).filter(Boolean)).size;

    const endDate = new Date(sprint.endDate);
    const today = new Date();
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let sprintHealth = {
        label: 'Yolunda',
        color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    };
    if (sprint.status === 'Active') {
        if (diffDays < 0) {
            sprintHealth = {
                label: 'Süresi Geçti',
                color: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            };
        } else if (progressPercent < 40 && diffDays <= 3) {
            sprintHealth = {
                label: 'Dikkat Gerekiyor',
                color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            };
        }
    }

    return (
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-auto bg-[#f7f8fa] px-4 py-4 dark:bg-gray-950 sm:px-5 select-none space-y-5">
            {/* Geri Dönüş Linki */}
            <div className="shrink-0">
                <Link
                    to="/backlog"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    <ArrowLeft size={14} />
                    <span>Backlog'a dön</span>
                </Link>
            </div>

            {/* Bilgi ve Header Kartı */}
            <div className="space-y-4 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        {isEditing ? (
                            <div className="max-w-lg space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-800/50">
                                <div>
                                    <label className="text-[10px] text-muted font-bold uppercase block mb-1">Sprint Adı</label>
                                    <input
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="text-base font-bold input-base border rounded px-2.5 py-1 w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted font-bold uppercase block mb-1">Sprint Hedefi</label>
                                    <textarea
                                        value={editForm.goal}
                                        onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                                        placeholder="Sprint hedefi ekleyin..."
                                        rows={2}
                                        className="w-full input-base border rounded px-2.5 py-1 text-xs"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-muted font-bold uppercase block mb-1">Başlangıç Tarihi</label>
                                        <input
                                            type="date"
                                            value={editForm.startDate}
                                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                            className="input-base border rounded px-2 py-1 text-xs w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-muted font-bold uppercase block mb-1">Bitiş Tarihi</label>
                                        <input
                                            type="date"
                                            value={editForm.endDate}
                                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                            className="input-base border rounded px-2 py-1 text-xs w-full"
                                        />
                                    </div>
                                </div>
                                {editError && <p className="text-rose-500 dark:text-rose-400 text-xs">{editError}</p>}
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        onClick={handleSaveEdit}
                                        className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-blue-700 transition cursor-pointer"
                                    >
                                        Kaydet
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="text-xs border border-gray-300 dark:border-gray-600 text-secondary font-semibold px-3 py-1.5 rounded-md hover-surface transition cursor-pointer"
                                    >
                                        İptal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {sprint.name}
                                    </h1>

                                    <span
                                        className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${sprint.status === 'Active'
                                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        {sprint.status === 'Active' ? 'Active Sprint' : 'Completed'}
                                    </span>

                                    {sprint.status === 'Active' && (
                                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${sprintHealth.color}`}>
                                            {sprintHealth.label}
                                        </span>
                                    )}
                                </div>

                                {sprint.goal && <p className="text-xs text-secondary leading-relaxed max-w-2xl">{sprint.goal}</p>}
                            </>
                        )}
                    </div>

                    {/* Sağ Üst Aksiyonlar */}
                    {!isEditing && (
                        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                            {isPM && (
                                <button
                                    onClick={startEditing}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                                >
                                    <Pencil size={13} />
                                    <span>Düzenle</span>
                                </button>
                            )}

                            {sprint.status === 'Completed' && (
                                <Link
                                    to={`/retrospective?sprintId=${sprint.id}`}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                                >
                                    Retrospective'i Gör
                                </Link>
                            )}

                            {sprint.status === 'Active' && isPM && (
                                <button
                                    onClick={handleComplete}
                                    className="text-xs border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-semibold px-3 py-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={14} />
                                    <span>Sprint'i Tamamla</span>
                                </button>
                            )}

                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="rounded-md border border-gray-300 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
                                        <Link
                                            to="/backlog"
                                            className="block px-3 py-2 text-secondary hover-surface"
                                        >
                                            Backlog'da Düzenle
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-2 border-t border-gray-200 pt-3 text-xs dark:border-gray-800 sm:grid-cols-5">
                    <div className="flex items-center gap-2 border-r border-gray-100 py-1 pr-3 dark:border-gray-800">
                        <Calendar size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tarih</p>
                            <p className="font-semibold text-primary">
                                {new Date(sprint.startDate).toLocaleDateString('tr-TR')} — {new Date(sprint.endDate).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-r border-gray-100 py-1 pr-3 dark:border-gray-800">
                        <Clock size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Kalan Süre</p>
                            <p className="font-semibold text-primary">
                                {sprint.status === 'Completed' ? 'Tamamlandı' : diffDays > 0 ? `${diffDays} gün kaldı` : 'Süre doldu'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-r border-gray-100 py-1 pr-3 dark:border-gray-800">
                        <Layers size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Görev Sayısı</p>
                            <p className="font-semibold text-primary">{allTasks.length} Issues</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-r border-gray-100 py-1 pr-3 dark:border-gray-800">
                        <TrendingUp size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Story Points</p>
                            <p className="font-semibold text-primary">{totalStoryPoints} SP</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 py-1 pr-3 col-span-2 sm:col-span-1 border-r-0">
                        <UserCheck size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Ekip</p>
                            <p className="font-semibold text-primary">{uniqueAssigneesCount} Assignee</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-secondary">
                        <span>Sprint İlerlemesi ({progressPercent}%)</span>
                        <span>{completedTasks.length} / {allTasks.length} Görev Tamamlandı</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                            style={{ width: `${progressPercent}%` }}
                            className="h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Burndown & Velocity Paneli */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-md border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-primary text-sm flex items-center gap-2">
                            <Activity size={16} className="text-blue-600 dark:text-blue-400" />
                            <span>Burndown Chart</span>
                        </h2>
                    </div>
                    {burndown ? (
                        <BurndownChart data={burndown} />
                    ) : (
                        <div className="h-48 flex items-center justify-center text-xs text-muted">
                            Grafik verisi yükleniyor...
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-between space-y-4 rounded-md border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="border-b border-gray-100 pb-2 text-[13px] font-semibold text-gray-800 dark:border-gray-800 dark:text-gray-100">
                        Sprint Velocity & SP Summary
                    </h2>

                    <div className="space-y-3 flex-1 justify-center flex flex-col">
                        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Completed SP</p>
                                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{completedStoryPoints} SP</p>
                            </div>
                            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">Done</span>
                        </div>

                        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Remaining SP</p>
                                <p className="text-xl font-bold text-secondary">{remainingStoryPoints} SP</p>
                            </div>
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-secondary font-bold px-2 py-0.5 rounded">In Scope</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3 text-xs text-secondary flex items-center justify-between">
                        <span>Tamamlanma Oranı</span>
                        <span className="font-bold text-primary">{progressPercent}%</span>
                    </div>
                </div>
            </div>

            {/* Filtreleme Toolbarı */}
            <div className="flex flex-col items-stretch justify-between gap-2 border-b border-gray-200 bg-white py-3 dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Arama yap..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full input-base rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={assigneeFilter}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'all' || val === 'me' || val === 'unassigned') {
                                    setAssigneeFilter(val);
                                }
                            }}
                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="all">Assignee: Tümü</option>
                            <option value="me">Yalnızca Bana Atananlar</option>
                            <option value="unassigned">Atanmamışlar</option>
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="all">Type: Tümü</option>
                            <option value="bug">Bug</option>
                            <option value="task">Task</option>
                            <option value="story">Story</option>
                            <option value="epic">Epic</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="input-base cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="all">Priority: Tümü</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Görev Listesi veya Empty State */}
            <div>
                {tasksLoading ? (
                    <p className="text-secondary text-xs p-4">Görevler yükleniyor...</p>
                ) : filteredTasks.length === 0 ? (
                    <div className="rounded-md border border-gray-200 bg-white px-4 py-10 text-center dark:border-gray-800 dark:bg-gray-900">
                        <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <Layers size={20} />
                        </div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Bu sprintte filtrelere uygun görev bulunamadı.</p>
                        <div className="mt-3">
                            <Link
                                to="/backlog"
                                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                <Plus size={14} />
                                <span>Backlog'dan Görev Ekle</span>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {tasksByStatus.map((group) => (
                            <div key={group.status} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[group.status] ?? STATUS_STYLES.ToDo}`}>
                                        {group.label}
                                    </span>
                                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                        ({group.tasks.length})
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                    {group.tasks.map((task) => (
                                        <TaskCard key={task.id} task={task} projectId={selectedProjectId} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                danger={confirmState.danger}
                confirmLabel="Tamamla"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}