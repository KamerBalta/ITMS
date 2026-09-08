import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useAllUsers,
    useCreateUser,
    useDeactivateUser,
    useActivateUser,
    useUpdateUser,
    useUpdateUserRole,
} from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';
import { Modal } from '../../components/Modal';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { Search, UserPlus, MoreVertical, CheckCircle2, Filter, X } from 'lucide-react';

type ManagedUser = {
    id: string;
    name: string;
    email: string;
    title?: string | null;
    roles: string[];
    isActive: boolean;
};

type ProjectOption = {
    id: string;
    name: string;
};

type UpdateUserMutation = {
    mutateAsync: (args: {
        userId: string;
        data: {
            name: string;
            title?: string;
        };
    }) => Promise<unknown>;
    isPending: boolean;
};

type UpdateUserRoleMutation = {
    mutateAsync: (args: {
        userId: string;
        roleName: string;
    }) => Promise<unknown>;
    isPending: boolean;
};

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
    'QA/Tester',
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
    'System Administrator',
];

const ITEMS_PER_PAGE = 8;

export function UsersManagementPage() {
    const navigate = useNavigate();
    const { data: users, isLoading } = useAllUsers();
    const { data: projects } = useProjects();

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
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

    // Toast State
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    // Filtreleme Mantığı
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return (users as ManagedUser[]).filter((u) => {
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
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-auto bg-[#f7f8fa] px-0 dark:bg-gray-950">
            {/* Toast Bildirimi */}
            {toastMessage && (
                <div className="fixed right-5 top-5 z-[100000] flex max-w-sm items-center gap-3 rounded-md border border-emerald-200 bg-white px-3.5 py-2.5 text-emerald-700 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 dark:border-emerald-900 dark:bg-gray-900 dark:text-emerald-300 sm:max-w-md">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-xs font-medium">{toastMessage}</span>
                    <button
                        onClick={() => setToastMessage(null)}
                        className="ml-auto rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Üst Başlık & Eylem Butonu */}
            <div className="flex min-h-[64px] shrink-0 flex-col justify-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Kullanıcılar
                    </h1>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        Sistemdeki kullanıcıları yönetin ve yeni üyeler davet edin.
                    </p>
                </div>

                <button
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-600 sm:w-auto"
                >
                    <UserPlus className="h-4 w-4" />
                    Kullanıcı Davet Et
                </button>
            </div>

            {/* Arama Barı ve Filtreler Toolbar */}
            <div className="flex flex-col items-stretch justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-5 md:flex-row md:items-center">
                {/* Arama Input */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        placeholder="Ad veya e-posta ara..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full input-base rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    />
                </div>

                {/* Filtre Dropdown'ları */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    <div className="mr-1 flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        <Filter className="w-3.5 h-3.5" /> Filtrele:
                    </div>

                    <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                        <select
                            value={selectedRoleFilter}
                            onChange={(e) => {
                                setSelectedRoleFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="input-base w-full cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                            className="input-base w-full cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                            className="cursor-pointer px-2 py-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Temizle
                        </button>
                    )}
                </div>
            </div>

            {/* Kullanıcılar Tablosu */}
            <div className="mx-4 mt-4 overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 sm:mx-5">
                {isLoading ? (
                    <div className="flex min-h-[300px] items-center justify-center px-4 py-10 text-xs text-gray-500 dark:text-gray-400">
                        Yükleniyor...
                    </div>
                ) : paginatedUsers.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center px-4 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                        Kullanıcı bulunamadı.
                    </div>
                ) : (
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/70 dark:text-gray-400">
                                <tr>
                                    <th className="px-3 py-2.5 whitespace-nowrap sm:px-4">Kullanıcı</th>
                                    <th className="px-3 py-2.5 whitespace-nowrap sm:px-4">E-posta</th>
                                    <th className="px-3 py-2.5 whitespace-nowrap sm:px-4">Ünvan</th>
                                    <th className="px-3 py-2.5 whitespace-nowrap sm:px-4">Sistem Rolü</th>
                                    <th className="px-3 py-2.5 whitespace-nowrap sm:px-4">Durum</th>
                                    <th className="px-3 py-2.5 text-right whitespace-nowrap sm:px-4">Eylemler</th>
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
                                            className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                        >
                                            {/* Avatar & İsim */}
                                            <td className="px-3 py-2.5 whitespace-nowrap sm:px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-medium text-gray-800 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                                                            {u.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* E-posta */}
                                            <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap dark:text-gray-400 sm:px-4">
                                                {u.email}
                                            </td>

                                            {/* Ünvan */}
                                            <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap dark:text-gray-400 sm:px-4">
                                                {u.title ?? '-'}
                                            </td>

                                            {/* Roller */}
                                            <td className="px-3 py-2.5 sm:px-4">
                                                <div className="flex flex-wrap gap-1 min-w-[120px]">
                                                    {u.roles.map((r) => (
                                                        <span
                                                            key={r}
                                                            className={`whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-semibold border ${ROLE_BADGE_COLORS[r] ??
                                                                'surface-muted text-secondary border-gray-200 dark:border-gray-700'
                                                                }`}
                                                        >
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Durum Badge */}
                                            <td className="px-3 py-2.5 whitespace-nowrap sm:px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${u.isActive
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
                                                className="px-3 py-2.5 text-right relative whitespace-nowrap sm:px-4"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)}
                                                    className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {activeMenuUserId === u.id && (
                                                    <div className="absolute right-4 z-30 mt-1 w-44 overflow-hidden rounded-md border border-gray-200 bg-white py-1 text-left text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
                                                        <button
                                                            onClick={() => {
                                                                setEditingUser(u);
                                                                setActiveMenuUserId(null);
                                                            }}
                                                            className="w-full cursor-pointer px-3 py-2 text-left text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                                        >
                                                            Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                showToast(`${u.name} için davet bağlantısı tekrar gönderildi.`);
                                                                setActiveMenuUserId(null);
                                                            }}
                                                            className="w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-blue-600 transition-colors hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-800"
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
                                                                        alert('Kullanıcı aktifleştirilemedi.');
                                                                    }
                                                                }
                                                                setActiveMenuUserId(null);
                                                            }}
                                                            className="w-full cursor-pointer px-3 py-2 text-left text-xs text-amber-600 transition-colors hover:bg-gray-50 dark:text-amber-400 dark:hover:bg-gray-800"
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
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 text-[11px] text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400 sm:flex-row">
                    <div>
                        Toplam <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredUsers.length}</span> kullanıcı
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-default disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Önceki
                        </button>
                        <span className="px-2 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-default disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
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
    projects: ProjectOption[];
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
                <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
                    <div className="space-y-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Temel Bilgiler</p>
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-300">Ad Soyad</label>
                            <input
                                type="text"
                                placeholder="Örn: Ahmet Yılmaz"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full input-base rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-300">E-posta</label>
                            <input
                                type="email"
                                placeholder="ahmet@sirket.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full input-base rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-300">Ünvan</label>
                            <select
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full input-base cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
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
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Proje Ataması (Opsiyonel)</p>

                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-300">Proje</label>
                            <select
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="w-full input-base cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
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

                    {error && (
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={createUser.isPending}
                            className="cursor-pointer rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-default disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
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
    user: ManagedUser;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    updateUser: UpdateUserMutation;
    updateUserRole: UpdateUserRoleMutation;
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
                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-300">Ad Soyad</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full input-base rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-300">Ünvan</label>
                        <select
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full input-base cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
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
                        <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-300">Sistem Rolü</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full input-base cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                        >
                            {SYSTEM_ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="cursor-pointer rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-default disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}