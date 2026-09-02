import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTeams, useCreateTeam, useTeamDetail, useAddTeamMember, useRemoveTeamMember, useUpdateTeam } from '../../hooks/useTeams';
import { useAllUsers } from '../../hooks/useUsers';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { TEAM_ROLE_OPTIONS } from '../../lib/teamRoles';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

export function TeamsPage() {
    const currentUser = useAuthStore((state) => state.user);
    const isAdmin = currentUser?.roles.includes('System Admin') ?? false;
    const { data: teams, isLoading } = useTeams();
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary">Takımlar</h1>
                {isAdmin && (
                    <button onClick={() => setCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 cursor-pointer">
                        + Yeni Takım
                    </button>
                )}
            </div>

            {isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : !teams || teams.length === 0 ? (
                <p className="text-muted">Henüz takım oluşturulmamış.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => {
                        const isMyTeam = team.members.some((m) => m.userId === currentUser?.userId);
                        return (
                            <button
                                key={team.id}
                                onClick={() => setSelectedTeamId(team.id)}
                                className={`surface border rounded-lg p-4 text-left hover:shadow dark:hover:shadow-black/30 relative cursor-pointer ${isMyTeam ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-100 dark:ring-indigo-900' : ''
                                    }`}
                            >
                                {isMyTeam && (
                                    <span className="absolute top-2 right-2 text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                        Takımım
                                    </span>
                                )}
                                <p className="font-semibold text-primary">{team.name}</p>
                                {team.description && <p className="text-sm text-secondary mt-1">{team.description}</p>}
                                <p className="text-xs text-muted mt-2">{team.members.length} üye</p>
                            </button>
                        );
                    })}
                </div>
            )}

            <CreateTeamModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
            {selectedTeamId && <TeamDetailModal teamId={selectedTeamId} isAdmin={isAdmin} onClose={() => setSelectedTeamId(null)} />}
        </div>
    );
}

function CreateTeamModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const createTeam = useCreateTeam();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await createTeam.mutateAsync({ name, description: description || undefined });
            setName('');
            setDescription('');
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Takım oluşturulamadı.');
        }
    };

    return (
        <Modal title="Yeni Takım Oluştur" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Takım adı" value={name} onChange={(e) => setName(e.target.value)} required className="w-full input-base border rounded px-3 py-2 text-sm" />
                <textarea placeholder="Açıklama (opsiyonel)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm" rows={3} />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={createTeam.isPending} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
                    {createTeam.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
            </form>
        </Modal>
    );
}

function TeamDetailModal({ teamId, isAdmin, onClose }: { teamId: string; isAdmin: boolean; onClose: () => void }) {
    const { data: team, isLoading, isError } = useTeamDetail(teamId);
    const { data: allUsers } = useAllUsers();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [teamRole, setTeamRole] = useState('');
    const [roleError, setRoleError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const addMember = useAddTeamMember(teamId);
    const removeMember = useRemoveTeamMember(teamId);
    const updateTeam = useUpdateTeam(teamId);
    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editError, setEditError] = useState<string | null>(null);

    const startEditing = () => {
        setEditName(team?.name ?? '');
        setEditDescription(team?.description ?? '');
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setEditError(null);
        try {
            await updateTeam.mutateAsync({ name: editName, description: editDescription || undefined });
            setIsEditing(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setEditError(axiosError.response?.data?.message ?? 'Güncellenemedi.');
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setRoleError(null);

        if (!teamRole) {
            setRoleError('Takım içi rol zorunludur.');
            return;
        }
        if (!selectedUserId) return;

        try {
            await addMember.mutateAsync({ userId: selectedUserId, teamRole });
            setSelectedUserId('');
            setTeamRole('');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Üye eklenemedi.');
        }
    };

    const handleRemoveMember = async (userId: string, userName: string) => {
        const ok = await confirm('Üyeyi Çıkar', `"${userName}" adlı üyeyi takımdan çıkarmak istediğinize emin misiniz?`, true);
        if (ok) removeMember.mutate(userId);
    };

    const availableUsers = allUsers?.filter((u) => u.isActive && !team?.members.some((m) => m.userId === u.id)) ?? [];

    return (
        <>
            <Modal title={isEditing ? 'Takımı Düzenle' : team?.name ?? 'Takım'} isOpen onClose={onClose}>
                {isError ? (
                    <p className="text-red-500 text-sm">Bu takıma erişim yetkiniz yok.</p>
                ) : isLoading || !team ? (
                    <p className="text-muted text-sm">Yükleniyor...</p>
                ) : isEditing ? (
                    <div className="space-y-3">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm" />
                        <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full input-base border rounded px-3 py-2 text-sm" />
                        {editError && <p className="text-red-500 text-sm">{editError}</p>}
                        <div className="flex gap-2">
                            <button onClick={handleSaveEdit} disabled={updateTeam.isPending} className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
                                Kaydet
                            </button>
                            <button onClick={() => setIsEditing(false)} className="flex-1 border border-gray-300 dark:border-gray-600 py-1.5 rounded text-sm text-secondary cursor-pointer">
                                İptal
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-2 text-secondary">Projeler</p>
                            {team.activeProjects.length === 0 ? (
                                <p className="text-sm text-muted">Aktif olarak atandığı bir proje bulunmuyor.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {team.activeProjects.map((p) => (
                                        <span key={p} className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            {team.description && <p className="text-sm text-secondary">{team.description}</p>}
                            {isAdmin && (
                                <button onClick={startEditing} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap cursor-pointer">
                                    Düzenle
                                </button>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-medium mb-2 text-secondary">Üyeler</p>
                            {team.members.length === 0 ? (
                                <p className="text-sm text-muted">Henüz üye yok.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {team.members.map((m) => (
                                        <li key={m.userId} className="flex items-center justify-between text-sm py-1 text-secondary">
                                            <span>
                                                {m.userName} <span className="text-muted">— {m.teamRole}</span>
                                            </span>
                                            {isAdmin && (
                                                <button onClick={() => handleRemoveMember(m.userId, m.userName)} className="text-red-500 dark:text-red-400 hover:underline text-xs cursor-pointer">
                                                    Çıkar
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {isAdmin && (
                            <form onSubmit={handleAddMember} className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                                <p className="text-sm font-medium text-secondary">Üye Ekle</p>
                                <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required className="w-full input-base border rounded px-3 py-2 text-sm cursor-pointer">
                                    <option value="">Kullanıcı seçin...</option>
                                    {availableUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>

                                <div>
                                    <select value={teamRole} onChange={(e) => setTeamRole(e.target.value)} className={`w-full input-base border rounded px-3 py-2 text-sm cursor-pointer ${roleError ? 'border-red-400' : ''}`}>
                                        <option value="">Takım içi rol seçin...</option>
                                        {TEAM_ROLE_OPTIONS.map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    {roleError && <p className="text-red-500 text-xs mt-1">{roleError}</p>}
                                </div>

                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <button type="submit" disabled={addMember.isPending} className="w-full bg-indigo-600 text-white py-1.5 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
                                    Ekle
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} danger={confirmState.danger} confirmLabel="Çıkar" onConfirm={handleConfirm} onCancel={handleCancel} />
        </>
    );
}