import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTeams, useCreateTeam, useTeamDetail, useAddTeamMember, useRemoveTeamMember, useUpdateTeam } from '../../hooks/useTeams';
import { useAllUsers } from '../../hooks/useUsers';
import { Modal } from '../../components/Modal';
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
                <h1 className="text-2xl font-bold">Takımlar</h1>
                {isAdmin && (
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                    >
                        + Yeni Takım
                    </button>
                )}
            </div>

            {isLoading ? (
                <p className="text-gray-500">Yükleniyor...</p>
            ) : !teams || teams.length === 0 ? (
                <p className="text-gray-500">Henüz takım oluşturulmamış.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => {
                        // #4: kullanicinin uyesi oldugu takimlari ayirt et
                        const isMyTeam = team.members.some((m) => m.userId === currentUser?.userId);
                        return (
                            <button
                                key={team.id}
                                onClick={() => setSelectedTeamId(team.id)}
                                className={`bg-white border rounded-lg p-4 text-left hover:shadow relative ${isMyTeam ? 'border-indigo-300 ring-1 ring-indigo-100' : ''
                                    }`}
                            >
                                {isMyTeam && (
                                    <span className="absolute top-2 right-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                        Takımım
                                    </span>
                                )}
                                <p className="font-semibold">{team.name}</p>
                                {team.description && <p className="text-sm text-gray-500 mt-1">{team.description}</p>}
                                <p className="text-xs text-gray-400 mt-2">{team.members.length} üye</p>
                            </button>
                        );
                    })}
                </div>
            )}

            <CreateTeamModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
            {selectedTeamId && (
                <TeamDetailModal teamId={selectedTeamId} isAdmin={isAdmin} onClose={() => setSelectedTeamId(null)} />
            )}
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
                <input
                    type="text"
                    placeholder="Takım adı"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2 text-sm"
                />
                <textarea
                    placeholder="Açıklama (opsiyonel)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={3}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={createTeam.isPending}
                    className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {createTeam.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
            </form>
        </Modal>
    );
}

function TeamDetailModal({ teamId, isAdmin, onClose }: { teamId: string; isAdmin: boolean; onClose: () => void }) {
    const { data: team, isLoading } = useTeamDetail(teamId);
    const { data: allUsers } = useAllUsers();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [teamRole, setTeamRole] = useState('');
    const [roleError, setRoleError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const addMember = useAddTeamMember(teamId);
    const removeMember = useRemoveTeamMember(teamId);
    const updateTeam = useUpdateTeam(teamId);

    // #9: Takim duzenleme
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

        // #3: takim ici rol zorunlu
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

    // #2: pasif kullanicilari dropdown'dan tamamen cikar, ayrica zaten uye olanlari da gizle
    const availableUsers =
        allUsers?.filter((u) => u.isActive && !team?.members.some((m) => m.userId === u.id)) ?? [];

    return (
        <Modal title={isEditing ? 'Takımı Düzenle' : team?.name ?? 'Takım'} isOpen onClose={onClose}>
            {isLoading || !team ? (
                <p className="text-gray-500 text-sm">Yükleniyor...</p>
            ) : isEditing ? (
                <div className="space-y-3">
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    />
                    <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full border rounded px-3 py-2 text-sm"
                    />
                    {editError && <p className="text-red-500 text-sm">{editError}</p>}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveEdit}
                            disabled={updateTeam.isPending}
                            className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Kaydet
                        </button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 border py-1.5 rounded text-sm">
                            İptal
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        {team.description && <p className="text-sm text-gray-500">{team.description}</p>}
                        {isAdmin && (
                            <button onClick={startEditing} className="text-xs text-indigo-600 hover:underline whitespace-nowrap">
                                Düzenle
                            </button>
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-2">Üyeler</p>
                        {team.members.length === 0 ? (
                            <p className="text-sm text-gray-400">Henüz üye yok.</p>
                        ) : (
                            <ul className="space-y-1">
                                {team.members.map((m) => (
                                    <li key={m.userId} className="flex items-center justify-between text-sm py-1">
                                        <span>
                                            {m.userName} <span className="text-gray-400">— {m.teamRole}</span>
                                        </span>
                                        {isAdmin && (
                                            <button
                                                onClick={() => removeMember.mutate(m.userId)}
                                                className="text-red-500 hover:underline text-xs"
                                            >
                                                Çıkar
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {isAdmin && (
                        <form onSubmit={handleAddMember} className="space-y-2 border-t pt-3">
                            <p className="text-sm font-medium">Üye Ekle</p>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                required
                                className="w-full border rounded px-3 py-2 text-sm"
                            >
                                <option value="">Kullanıcı seçin...</option>
                                {availableUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>

                            <div>
                                <select
                                    value={teamRole}
                                    onChange={(e) => setTeamRole(e.target.value)}
                                    className={`w-full border rounded px-3 py-2 text-sm ${roleError ? 'border-red-400' : ''}`}
                                >
                                    <option value="">Takım içi rol seçin...</option>
                                    {TEAM_ROLE_OPTIONS.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                {roleError && <p className="text-red-500 text-xs mt-1">{roleError}</p>}
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button
                                type="submit"
                                disabled={addMember.isPending}
                                className="w-full bg-indigo-600 text-white py-1.5 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Ekle
                            </button>
                        </form>
                    )}
                </div>
            )}
        </Modal>
    );
}