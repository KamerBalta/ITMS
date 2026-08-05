import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { navItems } from '../lib/navigation';
import { ProjectSelector } from './ProjectSelector';
import { queryClient } from '../lib/queryClient';

export function AppLayout() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const refreshToken = useAuthStore((state) => state.refreshToken);
    const logout = useAuthStore((state) => state.logout);

    const isAdmin = user?.roles.includes('System Admin') ?? false;

    const handleLogout = async () => {
        if (refreshToken) {
            try {
                await authApi.logout(refreshToken);
            } catch {
                // Logout API'si başarısız olsa bile client tarafında oturumu kapatmaya devam et
            }
        }
        logout();
        navigate('/login');
    };

    const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-60 bg-white border-r flex flex-col">
                <div className="px-4 py-4 border-b">
                    <span className="text-lg font-bold text-indigo-600">ITMS</span>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Ana içerik */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-14 bg-white border-b flex items-center justify-between px-6">
                    <ProjectSelector />

                    <div className="flex items-center gap-4">
                        <NavLink to="/profile" className="text-sm text-gray-700 hover:underline">
                            {user?.email ?? '...'}
                        </NavLink>
                        <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
                            Çıkış Yap
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}