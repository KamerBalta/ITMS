import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUserDetail } from '../../hooks/useUsers';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';
import { apiClient } from '../../api/client';

export function UserDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { data: user, isLoading, isError } = useUserDetail(userId ?? null);

    if (isError) {
        return (
            <div className="text-center py-16">
                <p className="text-muted">Bu kullanıcı bulunamadı ya da görüntüleme yetkiniz yok.</p>
                <Link to="/admin/users" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
                    ← Kullanıcı Yönetimine dön
                </Link>
            </div>
        );
    }

    if (isLoading || !user) return <p className="text-muted">Yükleniyor...</p>;

    return (
        <div className="max-w-2xl space-y-6">
            <Link to="/admin/users" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                ← Kullanıcı Yönetimine dön
            </Link>

            <div className="surface border rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-200 dark:border-indigo-800">
                    {user.avatarUrl ? (
                        <AuthenticatedImage
                            src={`/users/${user.id}/avatar`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            fallback={<span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{user.name.charAt(0).toUpperCase()}</span>}
                        />
                    ) : (
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-primary">{user.name}</h1>
                    <p className="text-sm text-secondary">{user.title ?? 'Unvan belirtilmemiş'}</p>
                    <p className="text-sm text-muted">{user.email}</p>
                </div>
                <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold border ${user.isActive
                        ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/60'
                        : 'bg-gray-100 dark:bg-gray-800 text-secondary border-gray-200 dark:border-gray-700'
                        }`}
                >
                    {user.isActive ? 'Aktif' : 'Pasif'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="surface border rounded-lg p-4">
                    <p className="text-sm text-muted">Oluşturduğu Görev</p>
                    <p className="text-2xl font-bold text-primary">{user.createdTaskCount}</p>
                </div>
                <div className="surface border rounded-lg p-4">
                    <p className="text-sm text-muted">Atanmış Görev</p>
                    <p className="text-2xl font-bold text-primary">{user.assignedTaskCount}</p>
                </div>
            </div>

            <div className="surface border rounded-lg p-4">
                <p className="text-sm font-medium mb-2 text-primary">Sistem Rolleri</p>
                <div className="flex flex-wrap gap-2">
                    {user.systemRoles.map((r) => (
                        <span key={r} className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full border border-indigo-200/50 dark:border-indigo-900/50">
                            {r}
                        </span>
                    ))}
                </div>
            </div>

            <div className="surface border rounded-lg p-4">
                <p className="text-sm font-medium mb-2 text-primary">Üyesi Olduğu Projeler</p>
                {user.projects.length === 0 ? (
                    <p className="text-sm text-muted">Hiçbir projeye atanmamış.</p>
                ) : (
                    <ul className="space-y-1">
                        {user.projects.map((p) => (
                            <li key={p.projectId} className="flex items-center justify-between text-sm">
                                <Link to={`/projects/${p.projectId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                    {p.projectName}
                                </Link>
                                <span className="text-xs text-muted">{p.projectRole}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="surface border rounded-lg p-4">
                <p className="text-sm font-medium mb-2 text-primary">Üyesi Olduğu Takımlar</p>
                {user.teams.length === 0 ? (
                    <p className="text-sm text-muted">Hiçbir takıma üye değil.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {user.teams.map((t) => (
                            <span key={t} className="text-xs bg-gray-100 dark:bg-gray-700 text-secondary px-2 py-1 rounded-full">
                                {t}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Kullanıcı İşlemleri */}
            <div className="surface border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-primary">Kullanıcı İşlemleri</p>
                <div>
                    <button
                        onClick={async () => {
                            if (!confirm(`"${user.name}" kullanıcısını anonimleştirmek istediğinize emin misiniz? Bu işlem geri alınamaz — isim ve e-posta kalıcı olarak değiştirilir, hesap girişe kapatılır.`)) return;
                            try {
                                await apiClient.post(`/users/${userId}/anonymize`);
                                navigate('/admin/users');
                            } catch {
                                alert('Kullanıcı anonimleştirilirken bir hata oluştu.');
                            }
                        }}
                        className="text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition cursor-pointer font-medium"
                    >
                        Kullanıcıyı Anonimleştir (GDPR)
                    </button>
                </div>
            </div>

            <p className="text-xs text-muted">Katılım tarihi: {new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
        </div>
    );
}