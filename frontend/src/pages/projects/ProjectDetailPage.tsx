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
import { Avatar } from '../../components/Avatar';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const ROLE_BADGE_COLORS: Record<string, string> = {
    'Project Manager': 'bg-purple-100 text-purple-800 border-purple-200',
    'PM': 'bg-purple-100 text-purple-800 border-purple-200',
    'Developer': 'bg-blue-100 text-blue-800 border-blue-200',
    'QA': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Tester': 'bg-green-100 text-green-800 border-green-200',
};

export function ProjectDetailPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const canManage = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const { data: project, isLoading } = useProjectDetail(projectId ?? null);
    const { data: allTeams } = useTeams();
    const updateProject = useUpdateProject(projectId!);
    const archiveProject = useArchiveProject();
    const unarchiveProject = useUnarchiveProject();
    const addTeam = useAddTeamToProject(projectId!);
    const removeTeam = useRemoveTeamFromProject(projectId!);

    // Proje üyeleriyle ilgili Hook'lar ve State'ler
    const { data: projectMembers } = useProjectMembers(projectId ?? null);
    const [selectedMemberTeamId, setSelectedMemberTeamId] = useState('');
    const [selectedMemberUserId, setSelectedMemberUserId] = useState('');
    const [selectedProjectRole, setSelectedProjectRole] = useState('1'); // Varsayılan: Developer
    const { data: teamForMemberPicker } = useTeamDetail(selectedMemberTeamId || null);
    const addProjectMember = useAddProjectMember(projectId!);
    const removeProjectMember = useRemoveProjectMember(projectId!);
    const updateProjectMember = useUpdateProjectMember(projectId!);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedNewTeamId, setSelectedNewTeamId] = useState('');

    // Modal State'leri
    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState('');
    const [editingMemberTeamId, setEditingMemberTeamId] = useState('');
    const [editingMemberRole, setEditingMemberRole] = useState('1');

    if (isLoading || !project) return <p className="text-gray-500">Yükleniyor...</p>;

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
        if (!confirm('Bu projeyi arşivlemek istediğinize emin misiniz?')) return;
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

    const handleUpdateProjectMember = async () => {
        setError(null);
        try {
            await updateProjectMember.mutateAsync({
                memberId: editingMemberId,
                data: {
                    teamId: editingMemberTeamId,
                    projectRole: Number(editingMemberRole),
                },
            });
            setIsEditMemberModalOpen(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(
                axiosError.response?.data?.message ?? 'Üye güncellenemedi.'
            );
        }
    };

    const availableTeamMembers =
        teamForMemberPicker?.members.filter(
            (m) => !projectMembers?.some((pm) => pm.userId === m.userId)
        ) ?? [];

    const availableTeamsToAdd = allTeams?.filter((t) => !project.teamNames.includes(t.name)) ?? [];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Geri Gitme Butonu (Navigasyon) */}
            <div className="flex items-center">
                <Link
                    to="/projects"
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-indigo-600 transition"
                >
                    <span>←</span> Projelere Dön
                </Link>
            </div>

            {/* Hata Bildirimi */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between text-sm">
                    <span>❌ {error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 font-bold hover:text-red-700">
                        ✕
                    </button>
                </div>
            )}

            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                        <div className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                            Project
                        </div>

                        {isEditing ? (
                            <div className="mt-2 space-y-2">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-2xl font-bold border rounded px-2 py-1 w-full"
                                />
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    placeholder="Açıklama ekleyin..."
                                />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold mt-1 text-gray-900">
                                    {project.name}
                                </h1>
                                <p className="text-sm text-gray-500 mt-2">
                                    {project.description || 'Açıklama bulunmuyor.'}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                            <div className="text-xs text-gray-400 font-semibold uppercase">Key</div>
                            <div className="font-mono font-bold text-lg text-indigo-600">{project.key}</div>
                        </div>

                        {/* Yönetim Butonları (Header Sağ Üst) */}
                        {canManage && (
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 font-medium"
                                        >
                                            Kaydet
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-3 py-1.5 rounded text-sm border hover:bg-gray-50"
                                        >
                                            İptal
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={startEditing}
                                            className="px-3 py-1.5 rounded text-sm border hover:bg-gray-50 font-medium text-gray-700"
                                        >
                                            Düzenle
                                        </button>
                                        {project.status !== 'Archived' ? (
                                            <button
                                                onClick={handleArchive}
                                                className="px-3 py-1.5 rounded text-sm border border-red-300 text-red-600 hover:bg-red-50 font-medium"
                                            >
                                                Arşivle
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleUnarchive}
                                                className="px-3 py-1.5 rounded text-sm border border-green-300 text-green-600 hover:bg-green-50 font-medium"
                                            >
                                                Arşivden Çıkar
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {canManage && (
                    <div className="mt-6 pt-4 border-t flex items-center gap-4">
                        <Link
                            to={`/projects/${projectId}/issue-types`}
                            className="inline-block text-sm text-indigo-600 hover:underline font-medium"
                        >
                            Issue Types Yönetimi →
                        </Link>
                        <Link
                            to={`/projects/${projectId}/workflow`}
                            className="inline-block text-sm text-indigo-600 hover:underline font-medium"
                        >
                            Workflow Editörü →
                        </Link>
                    </div>
                )}
            </div>

            {/* İstatistik Kartları (4 Kolon) */}
            <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-400 uppercase">Sorumlu</p>
                    <p className="font-semibold text-gray-800 mt-1 text-base truncate">{project.ownerName}</p>
                </div>
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-400 uppercase">Üye Sayısı</p>
                    <p className="font-semibold text-gray-800 mt-1 text-base">{project.memberCount}</p>
                </div>
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-400 uppercase">Görev Sayısı</p>
                    <p className="font-semibold text-gray-800 mt-1 text-base">{project.taskCount}</p>
                </div>
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-400 uppercase">Durum</p>
                    <span
                        className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${project.status === 'Archived'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-green-100 text-green-800 border-green-200'
                            }`}
                    >
                        {project.status === 'Archived' ? 'Archived' : 'Active'}
                    </span>
                </div>
            </div>

            {/* İki Kolonlu Yapı: Takımlar & Üyeler */}
            <div className="grid grid-cols-2 gap-6">
                {/* SOL KOLON: TAKIMLAR */}
                <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h2 className="font-bold text-gray-800 text-base">TAKIMLAR</h2>
                        {canManage && availableTeamsToAdd.length > 0 && (
                            <button
                                onClick={() => setIsAddTeamModalOpen(true)}
                                className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-100 font-semibold"
                            >
                                + Takım Ekle
                            </button>
                        )}
                    </div>

                    {project.teamNames.length === 0 ? (
                        <p className="text-sm text-gray-400">Projeye henüz takım atanmamış.</p>
                    ) : (
                        <div className="space-y-2">
                            {project.teamNames.map((teamName) => (
                                <div
                                    key={teamName}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">👥</span>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">{teamName}</p>
                                        </div>
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
                <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h2 className="font-bold text-gray-800 text-base">PROJE ÜYELERİ</h2>
                        {canManage && projectTeamIds.length > 0 && (
                            <button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-100 font-semibold"
                            >
                                + Üye Ekle
                            </button>
                        )}
                    </div>

                    {!projectMembers || projectMembers.length === 0 ? (
                        <p className="text-sm text-gray-400">Bu projede henüz üye yok.</p>
                    ) : (
                        <ul className="space-y-2">
                            {projectMembers.map((m) => (
                                <li key={m.memberId} className="flex items-center gap-2 text-sm bg-white border rounded px-3 py-2">
                                    <Avatar userId={m.userId} name={m.userName} size="sm" />
                                    <span className="flex-1">
                                        {m.userName} {m.title && <span className="text-gray-400">· {m.title}</span>}
                                        <span className="text-gray-400"> — {m.teamName} — {m.projectRole}</span>
                                    </span>
                                    {canManage && (
                                        <button onClick={() => removeProjectMember.mutate(m.memberId)} className="text-red-500 text-xs hover:underline">
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
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-bold text-lg text-gray-800">Takım Ekle</h3>
                            <button
                                onClick={() => setIsAddTeamModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <select
                            value={selectedNewTeamId}
                            onChange={(e) => setSelectedNewTeamId(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
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
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-bold text-lg text-gray-800">Proje Üyesi Ekle</h3>
                            <button
                                onClick={() => setIsAddMemberModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Kademeli seçim: Önce Takım, sonra o takımın üyesi, sonra Proje Rolü seçin.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Takım</label>
                                <select
                                    value={selectedMemberTeamId}
                                    onChange={(e) => {
                                        setSelectedMemberTeamId(e.target.value);
                                        setSelectedMemberUserId('');
                                    }}
                                    className="w-full border rounded px-3 py-2 text-sm"
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
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kullanıcı</label>
                                    <select
                                        value={selectedMemberUserId}
                                        onChange={(e) => setSelectedMemberUserId(e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm"
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
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Proje Rolü</label>
                                <select
                                    value={selectedProjectRole}
                                    onChange={(e) => setSelectedProjectRole(e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                >
                                    <option value="0">Project Manager</option>
                                    <option value="1">Developer</option>
                                    <option value="2">QA</option>
                                    <option value="3">Tester</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <button
                                onClick={() => setIsAddMemberModalOpen(false)}
                                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
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

            {/* MODAL: Üye Düzenle */}
            {isEditMemberModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Üye Düzenle</h3>
                            <button
                                onClick={() => setIsEditMemberModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Takım</label>
                                <select
                                    value={editingMemberTeamId}
                                    onChange={(e) => setEditingMemberTeamId(e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Takım seçin...</option>
                                    {allTeams
                                        ?.filter((t) => projectTeamIds.includes(t.id))
                                        .map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Proje Rolü</label>
                                <select
                                    value={editingMemberRole}
                                    onChange={(e) => setEditingMemberRole(e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="0">Project Manager</option>
                                    <option value="1">Developer</option>
                                    <option value="2">QA</option>
                                    <option value="3">Tester</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <button
                                onClick={() => setIsEditMemberModalOpen(false)}
                                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleUpdateProjectMember}
                                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 font-medium"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}