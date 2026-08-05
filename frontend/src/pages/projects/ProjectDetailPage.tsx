import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '../../hooks/useProjectMembers';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

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

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedNewTeamId, setSelectedNewTeamId] = useState('');

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
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Üye eklenemedi.');
        }
    };

    // Seçilen takımın, zaten proje üyesi olmayan üyelerini göster (kademeli seçim - BR-018)
    const availableTeamMembers =
        teamForMemberPicker?.members.filter(
            (m) => !projectMembers?.some((pm) => pm.userId === m.userId)
        ) ?? [];

    const availableTeamsToAdd = allTeams?.filter((t) => !project.teamNames.includes(t.name)) ?? [];

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                {isEditing ? (
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-2xl font-bold border rounded px-2 py-1"
                    />
                ) : (
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                )}
                <span className="text-sm text-gray-400">{project.key}</span>
            </div>

            {isEditing ? (
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            ) : (
                <p className="text-gray-600">{project.description ?? 'Açıklama yok.'}</p>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-white border rounded p-3">
                    <p className="text-gray-400">Sorumlu</p>
                    <p className="font-medium">{project.ownerName}</p>
                </div>
                <div className="bg-white border rounded p-3">
                    <p className="text-gray-400">Üye Sayısı</p>
                    <p className="font-medium">{project.memberCount}</p>
                </div>
                <div className="bg-white border rounded p-3">
                    <p className="text-gray-400">Görev Sayısı</p>
                    <p className="font-medium">{project.taskCount}</p>
                </div>
            </div>

            {canManage && (
                <div>
                    <p className="text-sm font-medium mb-2">Takımlar</p>
                    <ul className="space-y-1">
                        {project.teamNames.map((teamName) => (
                            <li key={teamName} className="flex items-center justify-between text-sm bg-white border rounded px-3 py-2">
                                {teamName}
                                <button onClick={() => handleRemoveTeam(teamName)} className="text-red-500 text-xs hover:underline">
                                    Çıkar
                                </button>
                            </li>
                        ))}
                    </ul>

                    {availableTeamsToAdd.length > 0 && (
                        <div className="flex gap-2 mt-2">
                            <select
                                value={selectedNewTeamId}
                                onChange={(e) => setSelectedNewTeamId(e.target.value)}
                                className="flex-1 border rounded px-3 py-2 text-sm"
                            >
                                <option value="">Takım seçin...</option>
                                {availableTeamsToAdd.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddTeam}
                                className="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700"
                            >
                                Ekle
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Proje Üyeleri Bölümü */}
            <div>
                <p className="text-sm font-medium mb-2">Proje Üyeleri</p>
                {!projectMembers || projectMembers.length === 0 ? (
                    <p className="text-sm text-gray-400">Bu projede henüz üye yok.</p>
                ) : (
                    <ul className="space-y-1">
                        {projectMembers.map((m) => (
                            <li key={m.memberId} className="flex items-center justify-between text-sm bg-white border rounded px-3 py-2">
                                <span>
                                    {m.userName} {m.title && <span className="text-gray-400">· {m.title}</span>}
                                    <span className="text-gray-400"> — {m.teamName} — {m.projectRole}</span>
                                </span>
                                {canManage && (
                                    <button
                                        onClick={() => removeProjectMember.mutate(m.memberId)}
                                        className="text-red-500 text-xs hover:underline"
                                    >
                                        Çıkar
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {canManage && projectTeamIds.length > 0 && (
                    <div className="space-y-2 mt-3 border-t pt-3">
                        <p className="text-xs text-gray-500">Kademeli seçim: önce Takım, sonra o takımın üyesi, sonra Proje Rolü</p>
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

                        {selectedMemberTeamId && (
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
                        )}

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

                        <button
                            onClick={handleAddProjectMember}
                            disabled={!selectedMemberUserId}
                            className="w-full bg-indigo-600 text-white py-1.5 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Projeye Ekle
                        </button>
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {canManage && (
                <div className="flex gap-2 pt-2 border-t">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                            >
                                Kaydet
                            </button>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded text-sm border">
                                İptal
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={startEditing} className="px-4 py-2 rounded text-sm border">
                                Düzenle
                            </button>
                            {project.status !== 'Archived' ? (
                                <button
                                    onClick={handleArchive}
                                    className="px-4 py-2 rounded text-sm border border-red-300 text-red-600 hover:bg-red-50"
                                >
                                    Arşivle
                                </button>
                            ) : (
                                <button
                                    onClick={handleUnarchive}
                                    className="px-4 py-2 rounded text-sm border border-green-300 text-green-600 hover:bg-green-50"
                                >
                                    Arşivden Çıkar
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}