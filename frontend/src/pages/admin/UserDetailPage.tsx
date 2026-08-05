import { useParams, Link } from 'react-router-dom';
import { useUserDetail } from '../../hooks/useUsers';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';

export function UserDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const { data: user, isLoading } = useUserDetail(userId ?? null);

    if (isLoading || !user) return <p className="text-gray-500">Yükleniyor...</p>;

    return (
        <div className="max-w-2xl space-y-6">
            <Link to="/admin/users" className="text-sm text-indigo-600 hover:underline">
                ← Kullanıcı Yönetimine dön
            </Link>

            <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatarUrl ? (
                        <AuthenticatedImage
                            src={`/users/${user.id}/avatar`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            fallback={<span className="text-xl font-bold text-indigo-600">{user.name.charAt(0).toUpperCase()}</span>}
                        />
                    ) : (
                        <span className="text-xl font-bold text-indigo-600">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div>
                    <h1 className="text-xl font-bold">{user.name}</h1>
                    <p className="text-sm text-gray-500">{user.title ?? 'Unvan belirtilmemiş'}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                >
                    {user.isActive ? 'Aktif' : 'Pasif'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-400">Oluşturduğu Görev</p>
                    <p className="text-2xl font-bold">{user.createdTaskCount}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-400">Atanmış Görev</p>
                    <p className="text-2xl font-bold">{user.assignedTaskCount}</p>
                </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Sistem Rolleri</p>
                <div className="flex flex-wrap gap-2">
                    {user.systemRoles.map((r) => (
                        <span key={r} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                            {r}
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Üyesi Olduğu Projeler</p>
                {user.projects.length === 0 ? (
                    <p className="text-sm text-gray-400">Hiçbir projeye atanmamış.</p>
                ) : (
                    <ul className="space-y-1">
                        {user.projects.map((p) => (
                            <li key={p.projectId} className="flex items-center justify-between text-sm">
                                <Link to={`/projects/${p.projectId}`} className="text-indigo-600 hover:underline">
                                    {p.projectName}
                                </Link>
                                <span className="text-xs text-gray-400">{p.projectRole}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="bg-white border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Üyesi Olduğu Takımlar</p>
                {user.teams.length === 0 ? (
                    <p className="text-sm text-gray-400">Hiçbir takıma üye değil.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {user.teams.map((t) => (
                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {t}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-400">Katılım tarihi: {new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
        </div>
    );
}