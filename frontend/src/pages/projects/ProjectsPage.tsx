import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Plus,
    LayoutGrid,
    List,
    ChevronRight,
    Users,
    FolderKanban,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useProjects, useCreateProject } from '../../hooks/useProjects';
import { useTeams } from '../../hooks/useTeams';
import { Modal } from '../../components/Modal';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const STATUS_STYLES: Record<string, string> = {
    Active: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    Archived: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

export function ProjectsPage() {
    const user = useAuthStore((state) => state.user);
    const canCreate = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const { data: projects, isLoading } = useProjects();
    const [isCreateOpen, setCreateOpen] = useState(false);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Archived'>('All');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const filteredProjects = useMemo(() => {
        return (projects ?? []).filter((project) => {
            const searchValue = search.toLowerCase().trim();

            const matchesSearch =
                !searchValue ||
                project.name.toLowerCase().includes(searchValue) ||
                project.key.toLowerCase().includes(searchValue) ||
                project.description?.toLowerCase().includes(searchValue);

            const matchesStatus =
                statusFilter === 'All' ||
                project.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [projects, search, statusFilter]);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-primary">
                            Projeler
                        </h1>

                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-secondary">
                            {projects?.length ?? 0}
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-secondary">
                        Erişebildiğiniz projeleri görüntüleyin ve yönetin.
                    </p>
                </div>

                {canCreate && (
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Yeni Proje
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
                <div className="relative min-w-[240px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Projelerde ara..."
                        className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-primary outline-none focus:border-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-md border border-border p-1">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('All')}
                            className={`rounded px-3 py-1.5 text-xs font-medium ${statusFilter === 'All'
                                    ? 'bg-surface-muted text-primary'
                                    : 'text-secondary hover:bg-surface-muted'
                                }`}
                        >
                            Tümü
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('Active')}
                            className={`rounded px-3 py-1.5 text-xs font-medium ${statusFilter === 'Active'
                                    ? 'bg-surface-muted text-primary'
                                    : 'text-secondary hover:bg-surface-muted'
                                }`}
                        >
                            Aktif
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('Archived')}
                            className={`rounded px-3 py-1.5 text-xs font-medium ${statusFilter === 'Archived'
                                    ? 'bg-surface-muted text-primary'
                                    : 'text-secondary hover:bg-surface-muted'
                                }`}
                        >
                            Arşivlenmiş
                        </button>
                    </div>

                    <div className="flex items-center gap-1 rounded-md border border-border p-1">
                        <button
                            type="button"
                            onClick={() => setView('grid')}
                            className={`rounded p-1.5 ${view === 'grid'
                                    ? 'bg-surface-muted text-primary'
                                    : 'text-muted hover:text-primary'
                                }`}
                            title="Kart görünümü"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className={`rounded p-1.5 ${view === 'list'
                                    ? 'bg-surface-muted text-primary'
                                    : 'text-muted hover:text-primary'
                                }`}
                            title="Liste görünümü"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-lg border border-border bg-surface p-8 text-center">
                    <p className="text-sm text-secondary">
                        Projeler yükleniyor...
                    </p>
                </div>
            ) : !projects || projects.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
                        <FolderKanban className="h-6 w-6 text-secondary" />
                    </div>

                    <h2 className="mt-4 text-base font-semibold text-primary">
                        Henüz proje bulunmuyor
                    </h2>

                    <p className="mt-1 text-sm text-secondary">
                        Erişebildiğiniz bir proje bulunamadı.
                    </p>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Yeni Proje
                        </button>
                    )}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface p-8 text-center">
                    <Search className="mx-auto h-6 w-6 text-muted" />

                    <p className="mt-3 text-sm font-medium text-primary">
                        Proje bulunamadı
                    </p>

                    <p className="mt-1 text-xs text-secondary">
                        Arama veya filtre kriterlerinizi değiştirin.
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setStatusFilter('All');
                        }}
                        className="mt-3 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        Filtreleri temizle
                    </button>
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProjects.map((p) => (
                        <Link
                            key={p.id}
                            to={`/projects/${p.id}`}
                            className="group rounded-lg border border-border bg-surface p-5 transition hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-800"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        <FolderKanban className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-primary">
                                            {p.name}
                                        </p>

                                        <p className="mt-0.5 text-xs font-medium text-secondary">
                                            {p.key}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status] ??
                                        'bg-gray-100 dark:bg-gray-700'
                                        }`}
                                >
                                    {p.status === 'Active'
                                        ? 'Aktif'
                                        : 'Arşivlenmiş'}
                                </span>
                            </div>

                            {p.description ? (
                                <p className="mt-4 line-clamp-2 min-h-[40px] text-sm leading-5 text-secondary">
                                    {p.description}
                                </p>
                            ) : (
                                <p className="mt-4 min-h-[40px] text-sm text-muted">
                                    Açıklama eklenmemiş.
                                </p>
                            )}

                            <div className="mt-5 border-t border-border pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-secondary">
                                        <Users className="h-4 w-4 text-muted" />

                                        <span>
                                            {p.teams.length} takım
                                        </span>
                                    </div>

                                    <ChevronRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
                                </div>

                                <p className="mt-2 truncate text-xs text-muted">
                                    Sorumlu: {p.ownerName}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-border bg-surface">
                    <div className="grid grid-cols-[minmax(240px,2fr)_120px_minmax(180px,1fr)_100px_40px] items-center border-b border-border bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">
                        <span>Proje</span>
                        <span>Durum</span>
                        <span>Sorumlu</span>
                        <span>Takımlar</span>
                        <span />
                    </div>

                    {filteredProjects.map((p) => (
                        <Link
                            key={p.id}
                            to={`/projects/${p.id}`}
                            className="grid grid-cols-[minmax(240px,2fr)_120px_minmax(180px,1fr)_100px_40px] items-center border-b border-border px-4 py-4 last:border-b-0 hover:bg-surface-muted/40"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                    <FolderKanban className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-primary">
                                        {p.name}
                                    </p>

                                    <p className="text-xs text-muted">
                                        {p.key}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status] ??
                                        'bg-gray-100 dark:bg-gray-700'
                                        }`}
                                >
                                    {p.status === 'Active'
                                        ? 'Aktif'
                                        : 'Arşivlenmiş'}
                                </span>
                            </div>

                            <span className="truncate text-sm text-secondary">
                                {p.ownerName}
                            </span>

                            <span className="flex items-center gap-1 text-sm text-secondary">
                                <Users className="h-4 w-4 text-muted" />
                                {p.teams.length}
                            </span>

                            <ChevronRight className="h-4 w-4 text-muted" />
                        </Link>
                    ))}
                </div>
            )}

            <CreateProjectModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
        </div>
    );
}

function CreateProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { data: teams } = useTeams();
    const createProject = useCreateProject();

    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [error, setError] = useState<string | null>(null);

    const toggleTeam = (teamId: string) => {
        setSelectedTeamIds((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (selectedTeamIds.length === 0) {
            setError('En az bir takım seçmelisiniz.');
            return;
        }

        try {
            await createProject.mutateAsync({
                name,
                key: key.toUpperCase(),
                description: description || undefined,
                teamIds: selectedTeamIds,
                startDate: startDate || null,
            });
            setName('');
            setKey('');
            setDescription('');
            setSelectedTeamIds([]);
            setStartDate('');
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Proje oluşturulamadı.');
        }
    };

    return (
        <Modal title="Yeni Proje Oluştur" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-primary">
                        Proje adı
                    </label>

                    <input
                        type="text"
                        placeholder="Örn. Infera ITMS"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-primary">
                        Proje anahtarı
                    </label>

                    <input
                        type="text"
                        placeholder="Örn. ITMS"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        required
                        maxLength={10}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm uppercase text-primary outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />

                    <p className="text-xs text-muted">
                        Proje anahtarı task'larda kullanılacaktır. Örn: ITMS-123
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-primary">
                        Açıklama (opsiyonel)
                    </label>

                    <textarea
                        placeholder="Proje hakkında kısa bilgi..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-primary">
                        Başlangıç tarihi (opsiyonel)
                    </label>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <p className="text-sm font-medium mb-2 text-secondary">Takım(lar) — kendi üyesi olduğunuz takımlardan seçin</p>
                    {!teams || teams.length === 0 ? (
                        <p className="text-sm text-muted">Henüz takım yok, önce Takımlar sayfasından oluşturun.</p>
                    ) : (
                        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                            {teams.map((t) => {
                                const selected = selectedTeamIds.includes(t.id);

                                return (
                                    <label
                                        key={t.id}
                                        className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition ${selected
                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                                : 'text-secondary hover:bg-surface-muted'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => toggleTeam(t.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                        />

                                        <Users className="h-4 w-4 text-muted" />

                                        <span className="flex-1">
                                            {t.name}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={createProject.isPending}
                        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-muted disabled:opacity-50"
                    >
                        İptal
                    </button>

                    <button
                        type="submit"
                        disabled={createProject.isPending}
                        className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {createProject.isPending
                            ? 'Oluşturuluyor...'
                            : 'Proje oluştur'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}