import { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
    useTeams,
    useCreateTeam,
    useTeamDetail,
    useAddTeamMember,
    useRemoveTeamMember,
    useUpdateTeam,
} from '../../hooks/useTeams';
import { useAllUsers } from '../../hooks/useUsers';
import { Modal } from '../../components/Modal';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';
import { TEAM_ROLE_OPTIONS } from '../../lib/teamRoles';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import {
    Users,
    User,
    Search,
    Plus,
    MoreHorizontal,
    UserPlus,
    Pencil,
    Trash2,
    X,
    FolderKanban
} from 'lucide-react';

const ROLE_BADGE_COLORS: Record<string, string> = {
    'Team Lead': 'bg-purple-100 text-purple-800 border-purple-200',
    'Tech Lead': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Developer': 'bg-blue-100 text-blue-800 border-blue-200',
    'QA Engineer': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Product Owner': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export function TeamsPage() {
    const currentUser = useAuthStore((state) => state.user);
    const avatarRefreshKey = useAuthStore((state) => state.avatarRefreshKey);
    const isAdmin = currentUser?.roles.includes('System Admin') ?? false;
    const { data: teams, isLoading } = useTeams();

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filtreleme ve İstatistikler
    const filteredTeams = useMemo(() => {
        if (!teams) return [];
        return teams.filter(
            (t) =>
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [teams, searchQuery]);

    const totalMembersCount = useMemo(() => {
        if (!teams) return 0;
        return teams.reduce((acc, team) => acc + (team.members?.length || 0), 0);
    }, [teams]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Üst Başlık ve Aksiyonlar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Takımlar</h1>
                    <p className="text-sm text-slate-500">Projedeki takımları yönetin ve üyeleri görüntüleyin.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        <span>Yeni Takım</span>
                    </button>
                )}
            </div>

            {/* İstatistik & Arama Barı */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Toplam Takım</p>
                        <p className="text-xl font-bold text-slate-800">{teams?.length || 0}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                        <User size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Toplam Üye</p>
                        <p className="text-xl font-bold text-slate-800">{totalMembersCount}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex items-center">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Takım ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white bg-slate-50 transition"
                        />
                    </div>
                </div>
            </div>

            {/* Takım Kartları Grid Yapısı */}
            {isLoading ? (
                <p className="text-slate-500 text-sm">Yükleniyor...</p>
            ) : !filteredTeams || filteredTeams.length === 0 ? (
                <p className="text-slate-500 text-sm">Hiç takım bulunamadı.</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {filteredTeams.map((team) => {
                        const isMyTeam = team.members.some((m) => m.userId === currentUser?.userId);
                        const extraMembersCount = Math.max(0, team.members.length - 3);

                        return (
                            <div
                                key={team.id}
                                onClick={() => setSelectedTeamId(team.id)}
                                className={`bg-white border rounded-lg p-5 text-left transition cursor-pointer flex flex-col justify-between space-y-4 relative ${isMyTeam ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                                                <Users size={18} />
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-base">{team.name}</h3>
                                        </div>
                                        {isMyTeam && (
                                            <span className="rounded bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-semibold shrink-0">
                                                My Team
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                                        {team.description || 'Açıklama bulunmuyor.'}
                                    </p>
                                </div>

                                {/* Alt Bilgiler: İstatistikler ve Avatarlar */}
                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center -space-x-2">
                                        {team.members.slice(0, 3).map((m) => {
                                            const initials = m.userName
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2);

                                            return (
                                                <div
                                                    key={m.userId}
                                                    title={`${m.userName} (${m.teamRole})`}
                                                    className="w-7 h-7 rounded-full overflow-hidden border-2 border-white ring-1 ring-slate-200"
                                                >
                                                    <AuthenticatedImage
                                                        src={`/users/${m.userId}/avatar`}
                                                        refreshKey={avatarRefreshKey}
                                                        alt={m.userName}
                                                        className="w-full h-full object-cover"
                                                        fallback={
                                                            <div className="w-full h-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                                                {initials}
                                                            </div>
                                                        }
                                                    />
                                                </div>
                                            );
                                        })}
                                        {extraMembersCount > 0 && (
                                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center border-2 border-white ring-1 ring-slate-200">
                                                +{extraMembersCount}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 font-medium text-slate-400">
                                        <span>{team.members.length} Members</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Yeni Takım Oluşturma Modalı */}
            <CreateTeamModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />

            {selectedTeamId && (
                <TeamDetailDrawer
                    teamId={selectedTeamId}
                    isAdmin={isAdmin}
                    avatarRefreshKey={avatarRefreshKey}
                    onClose={() => setSelectedTeamId(null)}
                />
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
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl w-full">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Takım Adı</label>
                    <input
                        type="text"
                        placeholder="Örn: Frontend Architecture Team"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Açıklama (Opsiyonel)</label>
                    <textarea
                        placeholder="Takımın sorumlulukları ve kapsamı..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={createTeam.isPending}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 font-medium cursor-pointer"
                    >
                        {createTeam.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* Sağ Taraf Detay Drawer Bileşeni (Max Width: max-w-lg) */
function TeamDetailDrawer({ teamId, isAdmin, avatarRefreshKey, onClose }: { teamId: string; isAdmin: boolean; avatarRefreshKey: number; onClose: () => void }) {
    const { data: team, isLoading } = useTeamDetail(teamId);
    const { data: allUsers } = useAllUsers();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [teamRole, setTeamRole] = useState('');
    const [roleError, setRoleError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);

    const addMember = useAddTeamMember(teamId);
    const removeMember = useRemoveTeamMember(teamId);
    const updateTeam = useUpdateTeam(teamId);

    // Takım Düzenleme
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editError, setEditError] = useState<string | null>(null);

    const startEditing = () => {
        setEditName(team?.name ?? '');
        setEditDescription(team?.description ?? '');
        setIsEditing(true);
        setIsMenuOpen(false);
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
            setIsAddFormOpen(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Üye eklenemedi.');
        }
    };

    const availableUsers =
        allUsers?.filter((u) => u.isActive && !team?.members.some((m) => m.userId === u.id)) ?? [];

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Arka Plan Karartması */}
            <div onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />

            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200">
                {/* Drawer Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Users size={18} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-slate-900 truncate">{team?.name ?? 'Yükleniyor...'}</h2>
                            <p className="text-xs text-slate-400 font-medium">{team?.members.length ?? 0} Members</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {/* Menü (MoreHorizontal) */}
                        {isAdmin && !isEditing && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition cursor-pointer"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 text-xs">
                                        <button
                                            onClick={startEditing}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                                        >
                                            <Pencil size={14} />
                                            <span>Düzenle</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Drawer Body */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {isLoading || !team ? (
                        <p className="text-slate-500 text-sm">Yükleniyor...</p>
                    ) : isEditing ? (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-sm text-slate-800">Takımı Düzenle</h3>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Takım Adı</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Açıklama</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {editError && <p className="text-red-500 text-xs">{editError}</p>}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={updateTeam.isPending}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                                >
                                    Kaydet
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="border border-slate-200 px-4 py-1.5 rounded-md text-xs hover:bg-white cursor-pointer"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Açıklama */}
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Açıklama
                                </p>
                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                                    {team.description || 'Açıklama bulunmuyor.'}
                                </p>
                            </div>

                            {/* Projeler (Projects Section) - Dinamik Listeleme */}
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Projeler (Projects)
                                </p>
                                {!team.activeProjects || team.activeProjects.length === 0 ? (
                                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                                        Aktif olarak atandığı bir proje bulunmuyor.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {team.activeProjects.map((p) => (
                                            <span
                                                key={p}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md"
                                            >
                                                <FolderKanban size={14} className="text-indigo-600" />
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Üyeler Listesi */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h3 className="font-bold text-slate-800 text-sm">Üyeler ({team.members.length})</h3>
                                    {isAdmin && !isAddFormOpen && (
                                        <button
                                            onClick={() => setIsAddFormOpen(true)}
                                            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-100 font-medium flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <UserPlus size={14} />
                                            <span>Add member</span>
                                        </button>
                                    )}
                                </div>

                                {/* Üye Ekleme Formu */}
                                {isAddFormOpen && (
                                    <form onSubmit={handleAddMember} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-slate-700">Yeni Üye Ekle</p>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddFormOpen(false)}
                                                className="text-xs text-slate-400 hover:text-slate-600"
                                            >
                                                Kapat
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[11px] text-slate-500 mb-1">Kullanıcı</label>
                                                <select
                                                    value={selectedUserId}
                                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                                    required
                                                    className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Kullanıcı seçin...</option>
                                                    {availableUsers.map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] text-slate-500 mb-1">Takım İçi Rol</label>
                                                <select
                                                    value={teamRole}
                                                    onChange={(e) => setTeamRole(e.target.value)}
                                                    className={`w-full border rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${roleError ? 'border-red-400' : 'border-slate-200'
                                                        }`}
                                                >
                                                    <option value="">Rol seçin...</option>
                                                    {TEAM_ROLE_OPTIONS.map((role) => (
                                                        <option key={role} value={role}>
                                                            {role}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {roleError && <p className="text-red-500 text-xs">{roleError}</p>}
                                        {error && <p className="text-red-500 text-xs">{error}</p>}

                                        <button
                                            type="submit"
                                            disabled={addMember.isPending}
                                            className="w-full bg-blue-600 text-white py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                                        >
                                            {addMember.isPending ? 'Ekleme yapılıyor...' : 'Ekle'}
                                        </button>
                                    </form>
                                )}

                                {/* Üye Kartları */}
                                {team.members.length === 0 ? (
                                    <p className="text-xs text-slate-400">Bu takımda henüz üye yok.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {team.members.map((m) => {
                                            const initials = m.userName
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2);

                                            const userDetail = allUsers?.find((u) => u.id === m.userId);

                                            return (
                                                <div
                                                    key={m.userId}
                                                    className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                                            <AuthenticatedImage
                                                                src={`/users/${m.userId}/avatar`}
                                                                refreshKey={avatarRefreshKey}
                                                                alt={m.userName}
                                                                className="w-full h-full object-cover"
                                                                fallback={
                                                                    <div className="w-full h-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                                                                        {initials}
                                                                    </div>
                                                                }
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-slate-800 text-xs truncate">
                                                                    {m.userName}
                                                                </p>
                                                                <span
                                                                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${ROLE_BADGE_COLORS[m.teamRole] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                                                                        }`}
                                                                >
                                                                    {m.teamRole}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 truncate">
                                                                {userDetail?.email ?? `${m.userName.toLowerCase().replace(/\s+/g, '')}@company.com`}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {isAdmin && (
                                                        <div className="relative shrink-0 ml-2">
                                                            <button
                                                                onClick={() => setActiveUserMenu(activeUserMenu === m.userId ? null : m.userId)}
                                                                className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
                                                            >
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                            {activeUserMenu === m.userId && (
                                                                <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 text-xs">
                                                                    <button
                                                                        onClick={() => {
                                                                            removeMember.mutate(m.userId);
                                                                            setActiveUserMenu(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                        <span>Remove</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}