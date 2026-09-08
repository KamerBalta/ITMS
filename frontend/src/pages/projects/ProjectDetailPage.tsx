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
    useDeleteProject,
    useRequestProjectAccess,
} from '../../hooks/useProjects';
import { useTeams, useTeamDetail } from '../../hooks/useTeams';
import {
    useProjectMembers,
    useAddProjectMember,
    useRemoveProjectMember,
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
    FileText,
    GitBranch,
    Pencil,
    Plus,
    Settings2,
    Trash2,
    UploadCloud,
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
    const deleteProject = useDeleteProject();
    const addTeam = useAddTeamToProject(projectId!);
    const removeTeam = useRemoveTeamFromProject(projectId!);

    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    // Silme yetki ve durum state'leri
    const isAdmin = user?.roles.includes('System Admin') ?? false;
    const canDelete = isAdmin || project?.ownerId === user?.userId;
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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
        return <AccessDeniedProjectView projectId={projectId!} />;
    }

    if (isLoading || !project) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center bg-[#f7f8fa] dark:bg-gray-950">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Proje yükleniyor...
                </div>
            </div>
        );
    }

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

    const handleDeleteProject = async () => {
        setDeleteError(null);
        try {
            await deleteProject.mutateAsync(projectId!);
            navigate('/projects');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setDeleteError(axiosError.response?.data?.message ?? 'Proje silinemedi.');
            setDeleteConfirmOpen(false);
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
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-auto bg-[#f7f8fa] dark:bg-gray-950">
            {/* Hata Bildirimi */}
            {(error || deleteError) && (
                <div className="mx-4 mt-3 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 sm:mx-5">
                    <span>{error || deleteError}</span>

                    <button
                        onClick={() => {
                            setError(null);
                            setDeleteError(null);
                        }}
                        className="ml-4 shrink-0 rounded p-1 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950"
                        aria-label="Kapat"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="px-4 py-4 sm:px-5">
                    <Link
                        to="/projects"
                        className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Projeler
                    </Link>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <Settings2 className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                {isEditing ? (
                                    <div className="max-w-2xl space-y-2">
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="input-base w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100"
                                        />

                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="input-base w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700"
                                            placeholder="Açıklama ekleyin..."
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
                                                {project.name}
                                            </h1>

                                            <span
                                                className={`rounded px-2 py-0.5 text-[11px] font-medium ${project.status === 'Archived'
                                                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                        : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                    }`}
                                            >
                                                {project.status === 'Archived' ? 'Arşivlenmiş' : 'Aktif'}
                                            </span>
                                        </div>

                                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                {project.key}
                                            </span>
                                            <span>·</span>
                                            <span>Proje</span>
                                        </div>

                                        <p className="mt-2 max-w-3xl text-sm leading-5 text-gray-600 dark:text-gray-400">
                                            {project.description || 'Açıklama bulunmuyor.'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={updateProject.isPending}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                        Kaydet
                                    </button>

                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        İptal
                                    </button>
                                </>
                            ) : (
                                <>
                                    {canManage && (
                                        <button
                                            onClick={startEditing}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Düzenle
                                        </button>
                                    )}

                                    {canManage &&
                                        (project.status !== 'Archived' ? (
                                            <button
                                                onClick={handleArchive}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                            >
                                                <Archive className="h-3.5 w-3.5" />
                                                Arşivle
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleUnarchive}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-green-950/30 dark:hover:text-green-400"
                                            >
                                                <Archive className="h-3.5 w-3.5" />
                                                Arşivden Çıkar
                                            </button>
                                        ))}

                                    {canDelete && (
                                        <button
                                            onClick={() => setDeleteConfirmOpen(true)}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Projeyi Sil
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="mx-4 mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 sm:mx-5 md:grid-cols-4">
                <div className="border-r border-gray-200 px-4 py-3.5 dark:border-gray-800">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sorumlu</p>
                    <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{project.ownerName}</p>
                </div>
                <div className="border-r border-gray-200 px-4 py-3.5 dark:border-gray-800">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Proje Üyeleri</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{project.memberCount}</p>
                </div>
                <div className="border-r border-gray-200 px-4 py-3.5 dark:border-gray-800">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Görevler</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{project.taskCount}</p>
                </div>
                <div className="px-4 py-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Durum</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {project.status === 'Archived' ? 'Arşivlenmiş' : 'Aktif'}
                    </p>
                </div>
            </div>

            {/* Proje Ayarları Listesi */}
            {canManage && (
                <section className="mx-4 mt-5 space-y-3 sm:mx-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Proje ayarları</h2>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Projenizin işleyişini ve yapılandırmasını yönetin.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <Link
                                to={`/projects/${projectId}/git-integration`}
                                target="_self"
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                                <GitBranch className="h-3.5 w-3.5" />
                                Git Entegrasyonu
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                                to={`/projects/${projectId}/issue-templates`}
                                target="_self"
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Issue Şablonları
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                                to={`/projects/${projectId}/bulk-import`}
                                target="_self"
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                                <UploadCloud className="h-3.5 w-3.5" />
                                Toplu Görev İçe Aktar (CSV)
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <Link
                            to={`/projects/${projectId}/git-integration`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Git Entegrasyonu</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">GitHub webhook ve otomatik commit bağlama ayarlarını yapılandırın.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/issue-types`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Issue Types</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Projede kullanılabilecek iş türlerini yönetin.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/workflow`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Workflow</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">İş akışı ve durum geçişlerini yapılandırın.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/board-settings`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Board Settings (Columns)</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Board sütunlarını, durum eşleştirmelerini ve WIP limitlerini yapılandırın.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/custom-fields`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Özel Alanlar</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Projeye özel alanları yönetin.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/automation`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Otomasyon</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Otomatik çalışan proje kurallarını yönetin.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/permissions`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Yetkiler</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Proje erişim ve yetki ayarlarını yönetin.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/components`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Component'ler</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Projeye ait modül ve bileşenleri yönetin.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/issue-templates`}
                            className="group flex items-center justify-between border-b border-gray-200 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Issue Şablonları</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Görev oluştururken kullanılabilecek hazır açıklama şablonlarını yönetin.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>

                        <Link
                            to={`/projects/${projectId}/bulk-import`}
                            className="group flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Toplu Görev İçe Aktarma</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">CSV dosyası üzerinden toplu görev ve hiyerarşi aktarımı yapın.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
                        </Link>
                    </div>
                </section>
            )}

            {/* Takımlar & Üyeler */}
            <div className="mx-4 mt-5 grid grid-cols-1 gap-4 pb-5 sm:mx-5 md:grid-cols-2">
                {/* SOL KOLON: TAKIMLAR */}
                <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Takımlar</h2>
                            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Bu projede çalışan takımlar</p>
                        </div>
                        {canManage && availableTeamsToAdd.length > 0 && (
                            <button
                                onClick={() => setIsAddTeamModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Takım Ekle
                            </button>
                        )}
                    </div>

                    {project.teamNames.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Projeye henüz takım atanmamış.</p>
                    ) : (
                        <div className="space-y-2">
                            {project.teamNames.map((teamName) => (
                                <div
                                    key={teamName}
                                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/60 dark:hover:bg-gray-800"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            {teamName.slice(0, 1).toUpperCase()}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{teamName}</p>
                                    </div>
                                    {canManage && (
                                        <button
                                            onClick={() => handleRemoveTeam(teamName)}
                                            className="shrink-0 rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
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
                <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Proje Üyeleri</h2>
                            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Projede yer alan üyeler</p>
                        </div>
                        {canManage && projectTeamIds.length > 0 && (
                            <button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Üye Ekle
                            </button>
                        )}
                    </div>

                    {!projectMembers || projectMembers.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Bu projede henüz üye yok.</p>
                    ) : (
                        <ul className="space-y-2">
                            {projectMembers.map((m) => (
                                <li
                                    key={m.memberId}
                                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
                                >
                                    <Avatar userId={m.userId} name={m.userName} size="sm" />
                                    <span className="flex-1 truncate text-sm">
                                        {m.userName} {m.title && <span className="text-gray-500 dark:text-gray-400">· {m.title}</span>}
                                        <span className="text-gray-500 dark:text-gray-400"> — {m.teamName} — {m.projectRole}</span>
                                    </span>
                                    {canManage && (
                                        <button
                                            onClick={() => removeProjectMember.mutate(m.memberId)}
                                            className="shrink-0 rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                        >
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
                    <div className="w-full max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Takım Ekle</h3>
                            <button
                                onClick={() => setIsAddTeamModalOpen(false)}
                                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                aria-label="Kapat"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <select
                            value={selectedNewTeamId}
                            onChange={(e) => setSelectedNewTeamId(e.target.value)}
                            className="input-base w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="">Takım seçin...</option>
                            {availableTeamsToAdd.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                            <button
                                onClick={() => setIsAddTeamModalOpen(false)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddTeam}
                                disabled={!selectedNewTeamId}
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Üye Ekle */}
            {isAddMemberModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
                    <div className="w-full max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Proje Üyesi Ekle</h3>
                            <button
                                onClick={() => setIsAddMemberModalOpen(false)}
                                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                aria-label="Kapat"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                            Kademeli seçim: Önce Takım, sonra o takımın üyesi, sonra Proje Rolü seçin.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Takım</label>
                                <select
                                    value={selectedMemberTeamId}
                                    onChange={(e) => {
                                        setSelectedMemberTeamId(e.target.value);
                                        setSelectedMemberUserId('');
                                    }}
                                    className="input-base w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Kullanıcı</label>
                                    <select
                                        value={selectedMemberUserId}
                                        onChange={(e) => setSelectedMemberUserId(e.target.value)}
                                        className="input-base w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Proje Rolü</label>
                                <select
                                    value={selectedProjectRole}
                                    onChange={(e) => setSelectedProjectRole(e.target.value)}
                                    className="input-base w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                    <option value="0">Project Manager</option>
                                    <option value="1">Developer</option>
                                    <option value="2">QA</option>
                                    <option value="3">Tester</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                            <button
                                onClick={() => setIsAddMemberModalOpen(false)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddProjectMember}
                                disabled={!selectedMemberUserId}
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Projeye Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Arşiv Onay Modalı */}
            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                danger={confirmState.danger}
                confirmLabel="Arşivle"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />

            {/* Proje Silme Onay Modalı */}
            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                title="Projeyi Sil"
                message="Projeyi silmek istediğinize emin misiniz? Bu işlem projeye bağlı görevler, sprintler, workflow, component ve diğer proje verilerini etkileyebilir."
                confirmLabel="Projeyi Sil"
                danger
                onConfirm={handleDeleteProject}
                onCancel={() => setDeleteConfirmOpen(false)}
            />
        </div>
    );
}

function AccessDeniedProjectView({ projectId }: { projectId: string }) {
    const requestAccess = useRequestProjectAccess();
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = async () => {
        setError(null);
        try {
            await requestAccess.mutateAsync({ projectId, message: message || undefined });
            setSent(true);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Talep gönderilemedi.');
        }
    };

    return (
        <div className="flex h-full min-h-0 items-center justify-center bg-[#f7f8fa] px-4 py-10 dark:bg-gray-950">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
                <p className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Bu projeye erişim yetkiniz yok.</p>
                {sent ? (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                        Erişim talebiniz proje sahibine iletildi.
                    </div>
                ) : (
                    <div className="space-y-2 text-left">
                        <textarea
                            placeholder="Talebinize kısa bir not ekleyin (opsiyonel)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={2}
                            className="input-base w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                        />
                        {error && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        )}
                        <button
                            onClick={handleRequest}
                            disabled={requestAccess.isPending}
                            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {requestAccess.isPending ? 'Gönderiliyor...' : 'Erişim Talep Et'}
                        </button>
                    </div>
                )}
                <Link
                    to="/projects"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Projelere dön
                </Link>
            </div>
        </div>
    );
}