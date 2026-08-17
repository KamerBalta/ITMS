import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    useProjectDetail,
    useUpdateProject,
    useArchiveProject,
    useUnarchiveProject,
    useAddTeamToProject,
    useRemoveTeamFromProject,
} from '../../hooks/useProjects';
import { useTeams, useTeamDetail } from '../../hooks/useTeams';
import {
    useProjectMembers,
    useAddProjectMember,
    useRemoveProjectMember,
    useUpdateProjectMember,
} from '../../hooks/useProjectMembers';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Avatar } from '../../components/Avatar';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import {
    ArrowLeft,
    Archive,
    Check,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    Plus,
    Settings2,
    X,
} from 'lucide-react';

export function ProjectDetailPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const canManage = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const { data: project, isLoading, isError } = useProjectDetail(projectId ?? null);
    const { data: allTeams } = useTeams();
    const updateProject = useUpdateProject(projectId!);
    const archiveProject = useArchiveProject();
    const unarchiveProject = useUnarchiveProject();
    const addTeam = useAddTeamToProject(projectId!);
    const removeTeam = useRemoveTeamFromProject(projectId!);

    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    // Proje üyeleriyle ilgili Hook'lar ve State'ler
    const { data: projectMembers } = useProjectMembers(projectId ?? null);
    const [selectedMemberTeamId, setSelectedMemberTeamId] = useState('');
    const [selectedMemberUserId, setSelectedMemberUserId] = useState('');
    const [selectedProjectRole, setSelectedProjectRole] = useState('1'); // Varsayılan: Developer
    const { data: teamForMemberPicker } = useTeamDetail(selectedMemberTeamId || null);
    const addProjectMember = useAddProjectMember(projectId!);
    const removeProjectMember = useRemoveProjectMember(projectId!);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedNewTeamId, setSelectedNewTeamId] = useState('');

    // Modal State'leri
    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    if (isError) {
        return (
            <div className="text-center py-16">
                <p className="text-muted">Bu proje bulunamadı veya erişim yetkiniz yok.</p>
                <Link to="/projects" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
                    ← Projelere dön
                </Link>
            </div>
        );
    }

    if (isLoading || !project) return <p className="text-muted">Yükleniyor...</p>;

    const projectTeamIds = allTeams?.filter((t) => project.teamNames.includes(t.name)).map((t) => t.id) ?? [];

    const startEditing = () => {
        setName(project.name);
        setDescription(project.description ?? '');
        setIsEditing(true);
    };

    const handleSave = async () => {
        setError(null);
        try {
            await updateProject.mutateAsync({ name, description: description || undefined });
            setIsEditing(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Güncellenemedi.');
        }
    };

    const handleArchive = async () => {
        setError(null);
        const ok = await confirm(
            'Projeyi Arşivle',
            'Bu projeyi arşivlemek istediğinize emin misiniz?',
            true
        );
        if (!ok) return;

        try {
            await archiveProject.mutateAsync(project.id);
            navigate('/projects');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Arşivlenemedi (aktif sprint olabilir).');
        }
    };

    const handleUnarchive = async () => {
        setError(null);
        try {
            await unarchiveProject.mutateAsync(project.id);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Arşivden çıkarılamadı.');
        }
    };

    const handleAddTeam = async () => {
        if (!selectedNewTeamId) return;
        setError(null);
        try {
            await addTeam.mutateAsync(selectedNewTeamId);
            setSelectedNewTeamId('');
            setIsAddTeamModalOpen(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Takım eklenemedi.');
        }
    };

    const handleRemoveTeam = async (teamName: string) => {
        setError(null);
        const team = allTeams?.find((t) => t.name === teamName);
        if (!team) return;
        try {
            await removeTeam.mutateAsync(team.id);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Takım çıkarılamadı.');
        }
    };

    const handleAddProjectMember = async () => {
        if (!selectedMemberTeamId || !selectedMemberUserId) return;
        setError(null);
        try {
            await addProjectMember.mutateAsync({
                teamId: selectedMemberTeamId,
                userId: selectedMemberUserId,
                projectRole: Number(selectedProjectRole),
            });
            setSelectedMemberTeamId('');
            setSelectedMemberUserId('');
            setIsAddMemberModalOpen(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Üye eklenemedi.');
        }
    };

    const availableTeamMembers =
        teamForMemberPicker?.members.filter(
            (m) => !projectMembers?.some((pm) => pm.userId === m.userId)
        ) ?? [];

    const availableTeamsToAdd = allTeams?.filter((t) => !project.teamNames.includes(t.name)) ?? [];

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            {/* Hata Bildirimi */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between text-sm">
                    <span>❌ {error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 font-bold hover:text-red-700">
                        ✕
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="border-b border-border pb-5">
                <Link
                    to="/projects"
                    className="mb-5 inline-flex items-center gap-2 text-sm text-secondary hover:text-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Projeler
                </Link>

                <div className="flex items-start justify-between gap-6">
                    <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            <Settings2 className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="text-2xl font-bold text-primary input-base border rounded px-2 py-1 w-full"
                                    />
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full input-base border rounded px-3 py-2 text-sm"
                                        placeholder="Açıklama ekleyin..."
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-semibold text-primary">
                                            {project.name}
                                        </h1>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${project.status === 'Archived'
                                                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                                }`}
                                        >
                                            {project.status === 'Archived'
                                                ? 'Arşivlenmiş'
                                                : 'Aktif'}
                                        </span>
                                    </div>

                                    <div className="mt-1 flex items-center gap-2 text-sm text-secondary">
                                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                            {project.key}
                                        </span>
                                        <span>·</span>
                                        <span>Proje</span>
                                    </div>

                                    <p className="mt-3 max-w-3xl text-sm text-secondary">
                                        {project.description || 'Açıklama bulunmuyor.'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex shrink-0 items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={updateProject.isPending}
                                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Check className="h-4 w-4" />
                                        Kaydet
                                    </button>

                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-muted"
                                    >
                                        <X className="h-4 w-4" />
                                        İptal
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={startEditing}
                                        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-muted"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Düzenle
                                    </button>

                                    {project.status !== 'Archived' ? (
                                        <button
                                            onClick={handleArchive}
                                            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                                        >
                                            <Archive className="h-4 w-4" />
                                            Arşivle
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleUnarchive}
                                            className="inline-flex items-center gap-2 rounded-md border border-green-200 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950"
                                        >
                                            <Archive className="h-4 w-4" />
                                            Arşivden Çıkar
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="rounded-md border border-border p-2 text-secondary hover:bg-surface-muted"
                                        title="Diğer seçenekler"
                                    >
                                        <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-2 border-y border-border md:grid-cols-4 bg-surface rounded-lg overflow-hidden border">
                <div className="border-r border-border px-5 py-4">
                    <p className="text-xs font-medium text-secondary">Sorumlu</p>
                    <p className="mt-1 truncate text-sm font-semibold text-primary">{project.ownerName}</p>
                </div>
                <div className="border-r border-border px-5 py-4">
                    <p className="text-xs font-medium text-secondary">Proje Üyeleri</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{project.memberCount}</p>
                </div>
                <div className="border-r border-border px-5 py-4">
                    <p className="text-xs font-medium text-secondary">Görevler</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{project.taskCount}</p>
                </div>
                <div className="px-5 py-4">
                    <p className="text-xs font-medium text-secondary">Durum</p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                        {project.status === 'Archived' ? 'Arşivlenmiş' : 'Aktif'}
                    </p>
                </div>
            </div>

            {/* Proje Ayarları Listesi */}
            {canManage && (
                <section>
                    <div className="mb-3">
                        <h2 className="text-lg font-semibold text-primary">Proje ayarları</h2>
                        <p className="mt-1 text-sm text-secondary">Projenizin işleyişini ve yapılandırmasını yönetin.</p>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-border bg-surface">
                        <Link
                            to={`/projects/${projectId}/issue-types`}
                            className="flex items-center justify-between border-b border-border px-5 py-4 hover:bg-surface-muted"
                        >
                            <div>
                                <p className="text-sm font-medium text-primary">Issue Types</p>
                                <p className="mt-1 text-xs text-secondary">Projede kullanılabilecek iş türlerini yönetin.</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/workflow`}
                            className="flex items-center justify-between border-b border-border px-5 py-4 hover:bg-surface-muted"
                        >
                            <div>
                                <p className="text-sm font-medium text-primary">Workflow</p>
                                <p className="mt-1 text-xs text-secondary">İş akışı ve durum geçişlerini yapılandırın.</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/custom-fields`}
                            className="flex items-center justify-between border-b border-border px-5 py-4 hover:bg-surface-muted"
                        >
                            <div>
                                <p className="text-sm font-medium text-primary">Özel Alanlar</p>
                                <p className="mt-1 text-xs text-secondary">Projeye özel alanları yönetin.</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/automation`}
                            className="flex items-center justify-between border-b border-border px-5 py-4 hover:bg-surface-muted"
                        >
                            <div>
                                <p className="text-sm font-medium text-primary">Otomasyon</p>
                                <p className="mt-1 text-xs text-secondary">Otomatik çalışan proje kurallarını yönetin.</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/permissions`}
                            className="flex items-center justify-between border-b border-border px-5 py-4 hover:bg-surface-muted"
                        >
                            <div>
                                <p className="text-sm font-medium text-primary">Yetkiler</p>
                                <p className="mt-1 text-xs text-secondary">Proje erişim ve yetki ayarlarını yönetin.</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/components`}
                            className="flex items-center justify-between px-5 py-4 hover:bg-surface-muted"
                        >
                            <div>
                                <p className="text-sm font-medium text-primary">Component'ler</p>
                                <p className="mt-1 text-xs text-secondary">Projeye ait modül ve bileşenleri yönetin.</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted" />
                        </Link>
                    </div>
                </section>
            )}

            {/* Takımlar & Üyeler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SOL KOLON: TAKIMLAR */}
                <div className="surface border rounded-lg p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                            <h2 className="text-base font-semibold text-primary">Takımlar</h2>
                            <p className="mt-1 text-xs text-secondary">Bu projede çalışan takımlar</p>
                        </div>
                        {canManage && availableTeamsToAdd.length > 0 && (
                            <button
                                onClick={() => setIsAddTeamModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-muted"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Takım Ekle
                            </button>
                        )}
                    </div>

                    {project.teamNames.length === 0 ? (
                        <p className="text-sm text-muted">Projeye henüz takım atanmamış.</p>
                    ) : (
                        <div className="space-y-2">
                            {project.teamNames.map((teamName) => (
                                <div
                                    key={teamName}
                                    className="flex items-center justify-between p-3 border rounded-lg surface-muted"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">👥</span>
                                        <p className="font-semibold text-primary text-sm">{teamName}</p>
                                    </div>
                                    {canManage && (
                                        <button
                                            onClick={() => handleRemoveTeam(teamName)}
                                            className="text-red-500 text-xs font-medium hover:underline"
                                        >
                                            Çıkar
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SAĞ KOLON: PROJE ÜYELERİ */}
                <div className="surface border rounded-lg p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                            <h2 className="text-base font-semibold text-primary">Proje Üyeleri</h2>
                            <p className="mt-1 text-xs text-secondary">Projede yer alan üyeler</p>
                        </div>
                        {canManage && projectTeamIds.length > 0 && (
                            <button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-muted"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Üye Ekle
                            </button>
                        )}
                    </div>

                    {!projectMembers || projectMembers.length === 0 ? (
                        <p className="text-sm text-muted">Bu projede henüz üye yok.</p>
                    ) : (
                        <ul className="space-y-2">
                            {projectMembers.map((m) => (
                                <li key={m.memberId} className="flex items-center gap-2 text-sm surface border rounded px-3 py-2">
                                    <Avatar userId={m.userId} name={m.userName} size="sm" />
                                    <span className="flex-1 truncate">
                                        {m.userName} {m.title && <span className="text-muted">· {m.title}</span>}
                                        <span className="text-muted"> — {m.teamName} — {m.projectRole}</span>
                                    </span>
                                    {canManage && (
                                        <button onClick={() => removeProjectMember.mutate(m.memberId)} className="text-red-500 text-xs hover:underline shrink-0">
                                            Çıkar
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* MODAL: Takım Ekle */}
            {isAddTeamModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="surface rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <h3 className="font-bold text-lg text-primary">Takım Ekle</h3>
                            <button
                                onClick={() => setIsAddTeamModalOpen(false)}
                                className="text-muted hover:text-secondary font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <select
                            value={selectedNewTeamId}
                            onChange={(e) => setSelectedNewTeamId(e.target.value)}
                            className="w-full input-base border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Takım seçin...</option>
                            {availableTeamsToAdd.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setIsAddTeamModalOpen(false)}
                                className="px-4 py-2 text-sm border rounded hover-surface"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddTeam}
                                disabled={!selectedNewTeamId}
                                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Üye Ekle */}
            {isAddMemberModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="surface rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <h3 className="font-bold text-lg text-primary">Proje Üyesi Ekle</h3>
                            <button
                                onClick={() => setIsAddMemberModalOpen(false)}
                                className="text-muted hover:text-secondary font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-muted">
                            Kademeli seçim: Önce Takım, sonra o takımın üyesi, sonra Proje Rolü seçin.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-secondary mb-1">Takım</label>
                                <select
                                    value={selectedMemberTeamId}
                                    onChange={(e) => {
                                        setSelectedMemberTeamId(e.target.value);
                                        setSelectedMemberUserId('');
                                    }}
                                    className="w-full input-base border rounded px-3 py-2 text-sm"
                                >
                                    <option value="">Takım seçin...</option>
                                    {allTeams?.filter((t) => projectTeamIds.includes(t.id)).map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedMemberTeamId && (
                                <div>
                                    <label className="block text-xs font-semibold text-secondary mb-1">Kullanıcı</label>
                                    <select
                                        value={selectedMemberUserId}
                                        onChange={(e) => setSelectedMemberUserId(e.target.value)}
                                        className="w-full input-base border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="">Kullanıcı seçin...</option>
                                        {availableTeamMembers.map((m) => (
                                            <option key={m.userId} value={m.userId}>
                                                {m.userName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-secondary mb-1">Proje Rolü</label>
                                <select
                                    value={selectedProjectRole}
                                    onChange={(e) => setSelectedProjectRole(e.target.value)}
                                    className="w-full input-base border rounded px-3 py-2 text-sm"
                                >
                                    <option value="0">Project Manager</option>
                                    <option value="1">Developer</option>
                                    <option value="2">QA</option>
                                    <option value="3">Tester</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                            <button
                                onClick={() => setIsAddMemberModalOpen(false)}
                                className="px-4 py-2 text-sm border rounded hover-surface"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddProjectMember}
                                disabled={!selectedMemberUserId}
                                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 font-medium"
                            >
                                Projeye Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                danger={confirmState.danger}
                confirmLabel="Arşivle"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}