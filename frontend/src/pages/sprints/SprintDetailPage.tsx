import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useSprints, useCompleteSprint, useUpdateSprint } from '../../hooks/useSprints';
import { useTasks } from '../../hooks/useTasks';
import { useBurndown } from '../../hooks/useDashboard';
import { useAuthStore } from '../../store/authStore';
import { BurndownChart } from '../../components/BurndownChart';
import { TaskCard } from '../../components/TaskCard';
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
    AlertCircle,
    Activity,
    Plus,
    Pencil
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
    ToDo: 'bg-slate-100 text-slate-700 border-slate-200',
    InProgress: 'bg-blue-100 text-blue-700 border-blue-200',
    ReadyForReview: 'bg-amber-100 text-amber-800 border-amber-200',
    ReadyForQA: 'bg-purple-100 text-purple-700 border-purple-200',
    Done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Closed: 'bg-slate-200 text-slate-600 border-slate-300',
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

    if (!selectedProjectId) {
        return <p className="text-slate-500 text-sm p-4">Devam etmek için üstten bir proje seçin.</p>;
    }

    if (!sprint) {
        return (
            <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
                <p className="text-slate-500 text-sm">Sprint bulunamadı ya da seçili projeye ait değil.</p>
                <Link to="/backlog" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline">
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
        } catch {
            setEditError('Sprint güncellenemedi.');
        }
    };

    const handleComplete = async () => {
        if (!confirm(`"${sprint.name}" sprintini tamamlamak istediğinize emin misiniz? Tamamlanmamış görevler Backlog'a geri dönecek.`))
            return;
        await completeSprint.mutateAsync(sprint.id);
        setIsMenuOpen(false);
    };

    // 1. İlerleme Hesabı & Metrikler
    const allTasks = tasks ?? [];
    const completedTasks = allTasks.filter((t) => t.status === 'Done' || t.status === 'Closed');
    const progressPercent = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

    const totalStoryPoints = sprint.totalStoryPoints ?? allTasks.reduce((acc, t) => acc + (t.storyPoint ?? 0), 0);
    const completedStoryPoints = completedTasks.reduce((acc, t) => acc + (t.storyPoint ?? 0), 0);
    const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

    // Atanan benzersiz kullanıcı sayısı
    const uniqueAssigneesCount = new Set(allTasks.map((t) => t.assigneeId).filter(Boolean)).size;

    // Kalan Gün Sayacı ve Sprint Sağlığı
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let sprintHealth = { label: 'Healthy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (sprint.status === 'Active') {
        if (diffDays < 0) {
            sprintHealth = { label: 'Overdue', color: 'bg-rose-50 text-rose-700 border-rose-200' };
        } else if (progressPercent < 40 && diffDays <= 3) {
            sprintHealth = { label: 'At Risk', color: 'bg-amber-50 text-amber-700 border-amber-200' };
        }
    }

    // 2. Filtrelenmiş Görevler
    const filteredTasks = useMemo(() => {
        return allTasks.filter((t) => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesAssignee = true;
            if (assigneeFilter === 'me') {
                matchesAssignee = t.assigneeId === user?.userId;
            } else if (assigneeFilter === 'unassigned') {
                matchesAssignee = !t.assigneeId;
            }

            let matchesType = true;
            if (typeFilter !== 'all') {
                matchesType = t.issueType.toLowerCase() === typeFilter.toLowerCase();
            }

            let matchesPriority = true;
            if (priorityFilter !== 'all') {
                matchesPriority = String(t.priority).toLowerCase() === priorityFilter.toLowerCase();
            }

            return matchesSearch && matchesAssignee && matchesType && matchesPriority;
        });
    }, [allTasks, searchQuery, assigneeFilter, typeFilter, priorityFilter, user?.userId]);

    // 3. Statülere göre Gruplama
    const tasksByStatus = STATUS_ORDER.map((status) => ({
        status,
        label: STATUS_LABELS[status],
        tasks: filteredTasks.filter((t) => t.status === status),
    })).filter((group) => group.tasks.length > 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0 select-none">
            {/* Üst Geri Dönüş Linki */}
            <div>
                <Link to="/backlog" className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline">
                    <ArrowLeft size={14} />
                    <span>Backlog'a dön</span>
                </Link>
            </div>

            {/* 1. BİLGİ VE HEADER KARTI */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        {isEditing ? (
                            <div className="space-y-3 max-w-lg bg-slate-50 p-3.5 border border-slate-200 rounded-lg">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sprint Adı</label>
                                    <input
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="text-base font-bold border border-slate-300 rounded px-2.5 py-1 w-full bg-white text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sprint Hedefi</label>
                                    <textarea
                                        value={editForm.goal}
                                        onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                                        placeholder="Sprint hedefi ekleyin..."
                                        rows={2}
                                        className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Başlangıç Tarihi</label>
                                        <input
                                            type="date"
                                            value={editForm.startDate}
                                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                            className="border border-slate-300 rounded px-2 py-1 text-xs w-full bg-white text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Bitiş Tarihi</label>
                                        <input
                                            type="date"
                                            value={editForm.endDate}
                                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                            className="border border-slate-300 rounded px-2 py-1 text-xs w-full bg-white text-slate-700"
                                        />
                                    </div>
                                </div>
                                {editError && <p className="text-rose-500 text-xs">{editError}</p>}
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        onClick={handleSaveEdit}
                                        className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-blue-700 transition"
                                    >
                                        Kaydet
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="text-xs border border-slate-300 text-slate-600 font-semibold px-3 py-1.5 rounded-md hover:bg-slate-100 transition"
                                    >
                                        İptal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-2xl font-bold text-slate-900">{sprint.name}</h1>

                                    <span
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${sprint.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                    >
                                        {sprint.status === 'Active' ? 'Active Sprint' : 'Completed'}
                                    </span>

                                    {sprint.status === 'Active' && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${sprintHealth.color}`}>
                                            ● {sprintHealth.label}
                                        </span>
                                    )}
                                </div>

                                {sprint.goal && <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{sprint.goal}</p>}
                            </>
                        )}
                    </div>

                    {/* Sağ Üst Aksiyonlar */}
                    {!isEditing && (
                        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                            {isPM && (
                                <button
                                    onClick={startEditing}
                                    className="text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
                                >
                                    <Pencil size={13} />
                                    <span>Düzenle</span>
                                </button>
                            )}

                            {sprint.status === 'Completed' && (
                                <Link
                                    to={`/retrospective?sprintId=${sprint.id}`}
                                    className="text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Retrospective'i Gör
                                </Link>
                            )}

                            {sprint.status === 'Active' && isPM && (
                                <button
                                    onClick={handleComplete}
                                    className="text-xs border border-rose-200 text-rose-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={14} />
                                    <span>Sprint'i Tamamla</span>
                                </button>
                            )}

                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition cursor-pointer"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 text-xs">
                                        <Link
                                            to="/backlog"
                                            className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                                        >
                                            Backlog'da Düzenle
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Grid İstatistikler */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={16} className="text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Tarih</p>
                            <p className="font-semibold text-slate-800">
                                {new Date(sprint.startDate).toLocaleDateString('tr-TR')} — {new Date(sprint.endDate).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={16} className="text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Kalan Süre</p>
                            <p className="font-semibold text-slate-800">
                                {sprint.status === 'Completed' ? 'Tamamlandı' : diffDays > 0 ? `${diffDays} gün kaldı` : 'Süre doldu'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                        <Layers size={16} className="text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Görev Sayısı</p>
                            <p className="font-semibold text-slate-800">{allTasks.length} Issues</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                        <TrendingUp size={16} className="text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Story Points</p>
                            <p className="font-semibold text-slate-800">{totalStoryPoints} SP</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 col-span-2 sm:col-span-1">
                        <UserCheck size={16} className="text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Ekip</p>
                            <p className="font-semibold text-slate-800">{uniqueAssigneesCount} Assignee</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar (Jira İlerleme Çubuğu) */}
                <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Sprint İlerlemesi ({progressPercent}%)</span>
                        <span>{completedTasks.length} / {allTasks.length} Görev Tamamlandı</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                        <div
                            style={{ width: `${progressPercent}%` }}
                            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* 2. BURNDOWN & VELOCITY YAN YANA PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Activity size={16} className="text-blue-600" />
                            <span>Burndown Chart</span>
                        </h2>
                    </div>
                    {burndown ? (
                        <BurndownChart data={burndown} />
                    ) : (
                        <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                            Grafik verisi yükleniyor...
                        </div>
                    )}
                </div>

                {/* Velocity & SP Metrik Özeti */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-4">
                    <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                        Sprint Velocity & SP Summary
                    </h2>

                    <div className="space-y-3 flex-1 justify-center flex flex-col">
                        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">Completed SP</p>
                                <p className="text-xl font-bold text-emerald-600">{completedStoryPoints} SP</p>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Done</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">Remaining SP</p>
                                <p className="text-xl font-bold text-slate-700">{remainingStoryPoints} SP</p>
                            </div>
                            <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">In Scope</span>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 flex items-center justify-between">
                        <span>Tamamlanma Oranı</span>
                        <span className="font-bold text-slate-800">{progressPercent}%</span>
                    </div>
                </div>
            </div>

            {/* 3. CANLI FİLTRELEME TOOLBARI */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row gap-3 shadow-2xs items-stretch md:items-center justify-between">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                    {/* Arama Input */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Arama yap..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                        />
                    </div>

                    {/* Filtre Dropdown'ları */}
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value as any)}
                            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Assignee: Tümü</option>
                            <option value="me">Yalnızca Bana Atananlar</option>
                            <option value="unassigned">Atanmamışlar</option>
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Priority: Tümü</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 4. GÖREV LİSTESİ VEYA EMPTY STATE */}
            <div>
                {tasksLoading ? (
                    <p className="text-slate-500 text-xs p-4">Görevler yükleniyor...</p>
                ) : filteredTasks.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                            <Layers size={24} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Bu sprintte filtrelere uygun görev bulunamadı.</p>
                        <Link
                            to="/backlog"
                            className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus size={14} />
                            <span>Backlog'dan Görev Ekle</span>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {tasksByStatus.map((group) => (
                            <div key={group.status} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${STATUS_STYLES[group.status]}`}>
                                        {group.label}
                                    </span>
                                    <span className="text-xs text-slate-400 font-semibold">({group.tasks.length})</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {group.tasks.map((task) => (
                                        <TaskCard key={task.id} task={task} projectId={selectedProjectId} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}