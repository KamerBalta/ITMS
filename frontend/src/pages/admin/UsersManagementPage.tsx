import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useAllUsers,
    useCreateUser,
    useDeactivateUser,
    useActivateUser,
    useUpdateUser,
    useUpdateUserRole
} from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';
import { useTeams } from '../../hooks/useTeams';
import { Modal } from '../../components/Modal';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { Search, UserPlus, MoreVertical, CheckCircle2, Filter, X } from 'lucide-react';

const ROLE_BADGE_COLORS: Record<string, string> = {
    'System Admin': 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900',
    'Project Manager': 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    'PM': 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    'Developer': 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    'QA/Tester': 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900',
    'QA': 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900',
    'Tester': 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900',
};

const SYSTEM_ROLES = [
    'System Admin',
    'Project Manager',
    'Developer',
    'QA/Tester'
];

const TITLE_OPTIONS = [
    'Software Engineer',
    'Senior Software Engineer',
    'Lead Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'QA Specialist',
    'QA Lead',
    'DevOps Engineer',
    'Project Manager',
    'Product Owner',
    'UI/UX Designer',
    'System Administrator'
];

const ITEMS_PER_PAGE = 8;

export function UsersManagementPage() {
    const navigate = useNavigate();
    const { data: users, isLoading } = useAllUsers();
    const { data: projects } = useProjects();
    const { data: allTeams } = useTeams();

    const deactivateUser = useDeactivateUser();
    const activateUser = useActivateUser();
    const updateUser = useUpdateUser();
    const updateUserRole = useUpdateUserRole();

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Toast State
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    // Filtreleme Mantığı
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.title && u.title.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesRole = selectedRoleFilter
                ? u.roles.includes(selectedRoleFilter)
                : true;

            const matchesStatus =
                selectedStatusFilter === 'active'
                    ? u.isActive
                    : selectedStatusFilter === 'passive'
                        ? !u.isActive
                        : true;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

    // Sayfalama (Pagination)
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 relative px-2 sm:px-4">
            {/* Toast Bildirimi */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-[100000] bg-emerald-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 max-w-sm sm:max-w-md">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                    <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white ml-auto cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Üst Başlık & Eylem Butonu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Kullanıcılar</h1>
                    <p className="text-sm text-secondary">Sistemdeki tüm kullanıcıları yönetin ve yeni üyeler davet edin.</p>
                </div>

                <button
                    onClick={() => setCreateOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2 shrink-0 shadow-sm w-full sm:w-auto cursor-pointer"
                >
                    <UserPlus className="w-4 h-4" />
                    + Kullanıcı Davet Et
                </button>
            </div>

            {/* Arama Barı ve Filtreler */}
            <div className="surface p-4 border rounded-xl shadow-sm flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
                {/* Arama Input */}
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
                    <input
                        type="text"
                        placeholder="Ad veya e-posta ara..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full input-base border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                    />
                </div>

                {/* Filtre Dropdown'ları */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-1 text-xs text-muted font-semibold mr-1">
                        <Filter className="w-3.5 h-3.5" /> Filtrele:
                    </div>

                    <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                        <select
                            value={selectedRoleFilter}
                            onChange={(e) => {
                                setSelectedRoleFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full border-gray-300 dark:border-gray-600 cursor-pointer"
                        >
                            <option value="">Tüm Roller</option>
                            <option value="System Admin">System Admin</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Developer">Developer</option>
                            <option value="QA/Tester">QA/Tester</option>
                        </select>

                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => {
                                setSelectedStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full border-gray-300 dark:border-gray-600 cursor-pointer"
                        >
                            <option value="">Tüm Durumlar</option>
                            <option value="active">Aktif</option>
                            <option value="passive">Pasif</option>
                        </select>
                    </div>

                    {(searchQuery || selectedRoleFilter || selectedStatusFilter) && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedRoleFilter('');
                                setSelectedStatusFilter('');
                                setCurrentPage(1);
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 text-center sm:text-left py-1 cursor-pointer"
                        >
                            Temizle
                        </button>
                    )}
                </div>
            </div>

            {/* Kullanıcılar Tablosu */}
            <div className="surface border rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-secondary text-sm">Yükleniyor...</div>
                ) : paginatedUsers.length === 0 ? (
                    <div className="p-8 text-center text-muted text-sm">Kullanıcı bulunamadı.</div>
                ) : (
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-sm text-left">
                            <thead className="surface-muted border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-secondary uppercase tracking-wider sticky top-0">
                                <tr>
                                    <th className="px-3 sm:px-5 py-3.5 whitespace-nowrap">Kullanıcı</th>
                                    <th className="px-3 sm:px-5 py-3.5 whitespace-nowrap">E-posta</th>
                                    <th className="px-3 sm:px-5 py-3.5 whitespace-nowrap">Ünvan</th>
                                    <th className="px-3 sm:px-5 py-3.5 whitespace-nowrap">Sistem Rolü</th>
                                    <th className="px-3 sm:px-5 py-3.5 whitespace-nowrap">Durum</th>
                                    <th className="px-3 sm:px-5 py-3.5 text-right whitespace-nowrap">Eylemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedUsers.map((u) => {
                                    const initials = u.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2);

                                    return (
                                        <tr
                                            key={u.id}
                                            onClick={() => navigate(`/admin/users/${u.id}`)}
                                            className="hover-surface transition cursor-pointer"
                                        >
                                            {/* Avatar & İsim */}
                                            <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800 shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-primary">{u.name}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* E-posta */}
                                            <td className="px-3 sm:px-5 py-3.5 text-secondary whitespace-nowrap">{u.email}</td>

                                            {/* Ünvan */}
                                            <td className="px-3 sm:px-5 py-3.5 text-secondary whitespace-nowrap">{u.title ?? '-'}</td>

                                            {/* Roller */}
                                            <td className="px-3 sm:px-5 py-3.5">
                                                <div className="flex flex-wrap gap-1 min-w-[120px]">
                                                    {u.roles.map((r) => (
                                                        <span
                                                            key={r}
                                                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ${ROLE_BADGE_COLORS[r] ?? 'surface-muted text-secondary border-gray-200 dark:border-gray-700'
                                                                }`}
                                                        >
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Durum Badge */}
                                            <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${u.isActive
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-500'
                                                            }`}
                                                    />
                                                    {u.isActive ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>

                                            {/* 3 Nokta Eylem Menüsü (⋮) */}
                                            <td
                                                className="px-3 sm:px-5 py-3.5 text-right relative whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)}
                                                    className="p-1.5 text-muted hover:text-primary rounded-lg hover-surface transition cursor-pointer"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {activeMenuUserId === u.id && (
                                                    <div className="absolute right-5 mt-1 w-44 surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 z-30 text-xs text-left">
                                                        <button
                                                            onClick={() => {
                                                                setEditingUser(u);
                                                                setActiveMenuUserId(null);
                                                            }}
                                                            className="w-full px-4 py-2 hover-surface text-secondary cursor-pointer"
                                                        >
                                                            Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                showToast(`${u.name} için davet bağlantısı tekrar gönderildi.`);
                                                                setActiveMenuUserId(null);
                                                            }}
                                                            className="w-full px-4 py-2 hover-surface text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer"
                                                        >
                                                            Yeniden Davet Gönder
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (u.isActive) {
                                                                    try {
                                                                        await deactivateUser.mutateAsync(u.id);
                                                                        showToast(`${u.name} pasifleştirildi.`);
                                                                    } catch {
                                                                        alert('Kullanıcı pasifleştirilemedi.');
                                                                    }
                                                                } else {
                                                                    try {
                                                                        await activateUser.mutateAsync(u.id);
                                                                        showToast(`${u.name} yeniden aktifleştirildi. Yeni aktivasyon e-postası gönderildi.`);
                                                                    } catch {
                                                                        alert("Kullanıcı aktifleştirilemedi.");
                                                                    }
                                                                }
                                                                setActiveMenuUserId(null);
                                                            }}
                                                            className="w-full px-4 py-2 hover-surface text-amber-600 dark:text-amber-400 cursor-pointer"
                                                        >
                                                            {u.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tablo Altı / Pagination */}
                <div className="p-4 surface-muted border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary">
                    <div>
                        Toplam <span className="font-semibold text-primary">{filteredUsers.length}</span> kullanıcı gösteriliyor
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded surface hover-surface disabled:opacity-40 transition cursor-pointer"
                        >
                            Önceki
                        </button>
                        <span className="px-2 font-medium">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded surface hover-surface disabled:opacity-40 transition cursor-pointer"
                        >
                            Sonraki
                        </button>
                    </div>
                </div>
            </div>

            {/* Kullanıcı Davet Et Modalı */}
            <CreateUserModal
                isOpen={isCreateOpen}
                onClose={() => setCreateOpen(false)}
                onSuccess={(msg) => showToast(msg)}
                projects={projects ?? []}
                allTeams={allTeams ?? []}
            />

            {/* Kullanıcı Düzenle Modalı */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={(msg) => showToast(msg)}
                    updateUser={updateUser}
                    updateUserRole={updateUserRole}
                />
            )}
        </div>
    );
}

{/* KULLANICI OLUŞTURMA MODALI */ }
function CreateUserModal({
    isOpen,
    onClose,
    onSuccess,
    projects,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    projects: any[];
    allTeams: any[];
}) {
    const createUser = useCreateUser();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [title, setTitle] = useState('');
    const [projectId, setProjectId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await createUser.mutateAsync({
                name,
                email,
                title: title || undefined,
                projectId: projectId || null,
            });

            onSuccess('✓ Kullanıcı daveti başarıyla gönderildi.');
            setName('');
            setEmail('');
            setTitle('');
            setProjectId('');
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Kullanıcı oluşturulamadı.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="relative z-[9999]">
            <Modal title="Kullanıcı Davet Et" isOpen={isOpen} onClose={onClose}>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-lg w-full">
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">Temel Bilgiler</p>
                        <div>
                            <label className="block text-xs font-semibold text-secondary mb-1">Ad Soyad</label>
                            <input
                                type="text"
                                placeholder="Örn: Ahmet Yılmaz"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-secondary mb-1">E-posta</label>
                            <input
                                type="email"
                                placeholder="ahmet@sirket.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-secondary mb-1">Ünvan</label>
                            <select
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="">Ünvan seçin...</option>
                                {TITLE_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="space-y-3">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">Proje Ataması (Opsiyonel)</p>

                        <div>
                            <label className="block text-xs font-semibold text-secondary mb-1">Proje</label>
                            <select
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="">Atama yapma</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-red-500 dark:text-red-400 text-xs font-medium">{error}</p>}

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover-surface text-secondary cursor-pointer"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={createUser.isPending}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                        >
                            {createUser.isPending ? 'Davet Ediliyor...' : 'Davet Gönder'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

{/* KULLANICI DÜZENLEME MODALI */ }
function EditUserModal({
    user,
    onClose,
    onSuccess,
    updateUser,
    updateUserRole,
}: {
    user: any;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    updateUser: any;
    updateUserRole: any;
}) {
    const [name, setName] = useState(user.name);
    const [title, setTitle] = useState(user.title ?? '');
    const [role, setRole] = useState(user.roles?.[0] ?? 'Developer');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await updateUser.mutateAsync({
                userId: user.id,
                data: {
                    name,
                    title: title || undefined,
                },
            });

            if (role !== user.roles?.[0]) {
                await updateUserRole.mutateAsync({
                    userId: user.id,
                    roleName: role,
                });
            }

            onSuccess('✓ Kullanıcı bilgileri ve rolü güncellendi.');
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Kullanıcı güncellenemedi.');
        }
    };

    const isPending = updateUser.isPending || updateUserRole.isPending;

    return (
        <div className="relative z-[9999]">
            <Modal title="Kullanıcı Düzenle" isOpen onClose={onClose}>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full">
                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Ad Soyad</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Ünvan</label>
                        <select
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            <option value="">Ünvan seçiniz...</option>
                            {TITLE_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Sistem Rolü</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            {SYSTEM_ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-red-500 dark:text-red-400 text-xs font-medium">{error}</p>}

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover-surface text-secondary cursor-pointer"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                        >
                            {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}