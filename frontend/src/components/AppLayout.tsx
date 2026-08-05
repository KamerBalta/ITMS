import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Search, Menu, X, Plus, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { authApi } from '../api/auth';
import { navItems } from '../lib/navigation';
import { useNotifications } from '../hooks/useNotifications';
import { ProjectSelector } from './ProjectSelector';
import { CreateTaskModal } from './CreateTaskModal';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearchPopover } from './GlobalSearchPopover';
import logoImg from '../assets/logo.png';

const SECTION_LABELS: Record<string, string> = {
    YOUR_WORK: 'YOUR WORK',
    PROJECT_PLANNING: 'PLANNING',
    TEAMS_REPORTS: 'TEAMS & ANALYTICS',
    SETTINGS: 'ADMINISTRATION',
};

const SECTION_ORDER = ['YOUR_WORK', 'PROJECT_PLANNING', 'TEAMS_REPORTS', 'SETTINGS'];

export function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const refreshToken = useAuthStore((state) => state.refreshToken);
    const logout = useAuthStore((state) => state.logout);
    const { data: notifications } = useNotifications();
    const { isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useUIStore();
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);

    const isAdmin = user?.roles.includes('System Admin') ?? false;
    const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
    const [isCreateOpen, setCreateOpen] = useState(false);

    // Canlı Arama Popover State'i
    const [isSearchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        closeMobileSidebar();
        setSearchOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const handleLogout = async () => {
        if (refreshToken) {
            try {
                await authApi.logout(refreshToken);
            } catch {
                // Logout hatasında istemci tarafında oturumu kapatmaya devam et
            }
        }
        logout();
        navigate('/login');
    };

    const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

    const getUserInitials = () => {
        if (user?.name) {
            return user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return user?.email?.slice(0, 2).toUpperCase() ?? 'UI';
    };

    return (
        <div className="min-h-screen flex bg-slate-50 text-slate-800">
            {/* Mobil Sidebar Perdesi */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Sidebar - Genişlik 240px (w-60) */}
            <aside
                className={`w-60 bg-white border-r border-slate-200 flex flex-col fixed md:static inset-y-0 left-0 z-40 transition-transform duration-200 select-none ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                {/* Logo & Başlık Alanı (Dashboard'a Yönlendirmeli) */}
                <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 group cursor-pointer"
                        title="Dashboard'a git"
                    >
                        <img
                            src={logoImg}
                            alt="ITMS Logo"
                            className="w-8 h-8 object-cover scale-150 shrink-0 transition-transform group-hover:scale-160"
                        />
                        <div>
                            <span className="text-lg font-extrabold text-slate-900 leading-none block group-hover:text-blue-600 transition-colors">
                                ITMS
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium leading-none">
                                Software Management
                            </span>
                        </div>
                    </Link>

                    <button onClick={closeMobileSidebar} className="md:hidden text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Oluştur Butonu */}
                <div className="px-3 py-3 border-b border-slate-100 shrink-0">
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="w-full h-9 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Oluştur</span>
                    </button>
                </div>

                {/* Navigasyon Linkleri */}
                <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {SECTION_ORDER.map((sectionKey) => {
                        const itemsInSection = visibleNavItems.filter((item) => (item.section ?? 'YOUR_WORK') === sectionKey);
                        if (itemsInSection.length === 0) return null;

                        return (
                            <div key={sectionKey} className="space-y-0.5">
                                <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
                                    {SECTION_LABELS[sectionKey] ?? sectionKey}
                                </div>

                                {itemsInSection.map((item) => {
                                    const IconComponent = item.icon;

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `flex items-center justify-between px-3 py-2 rounded-r-md text-sm transition-all duration-150 ${isActive
                                                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 -ml-3 pl-2.5'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent -ml-3 pl-2.5'
                                                }`
                                            }
                                        >
                                            <span className="flex items-center gap-2.5 min-w-0">
                                                {IconComponent && (
                                                    <span className="shrink-0 flex items-center justify-center">
                                                        <IconComponent size={18} strokeWidth={2} />
                                                    </span>
                                                )}
                                                <span className="truncate">{item.label}</span>
                                            </span>

                                            {item.path === '/notifications' && unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shrink-0">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Ana İçerik */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Responsive Header */}
                <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 gap-2 sm:gap-4 shrink-0 relative z-30">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {/* Mobil Hamburger Menü */}
                        <button
                            onClick={toggleMobileSidebar}
                            className="md:hidden text-slate-500 hover:text-slate-700 shrink-0 p-1.5 rounded-md hover:bg-slate-100 transition"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Proje Seçici */}
                        <div className="min-w-0 max-w-[140px] sm:max-w-xs md:max-w-none">
                            <ProjectSelector />
                        </div>

                        {/* Responsive Arama Alanı */}
                        <div className="relative min-w-0">
                            {/* Masaüstü Arama Çubuğu */}
                            <div
                                onClick={() => setSearchOpen(true)}
                                className="hidden lg:flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-md px-3 py-1.5 w-64 text-slate-400 cursor-text transition"
                            >
                                <Search className="w-4 h-4 shrink-0" />
                                <span className="text-xs text-slate-400 truncate">ITMS'de ara...</span>
                            </div>

                            {/* Mobil / Tablet Arama Butonu */}
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0"
                                title="Arama yap"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            {/* Canlı Arama Popover */}
                            <GlobalSearchPopover
                                isOpen={isSearchOpen}
                                onClose={() => setSearchOpen(false)}
                            />
                        </div>
                    </div>

                    {/* Sağ Taraf Aksiyonları */}
                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        <NotificationDropdown />

                        <NavLink
                            to="/profile"
                            className="flex items-center gap-2 p-0.5 sm:p-1 rounded-full hover:bg-slate-100 transition"
                            title={user?.email}
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border-2 border-indigo-200 shadow-2xs shrink-0">
                                {getUserInitials()}
                            </div>
                        </NavLink>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 sm:px-2.5 rounded-md transition font-medium cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Çıkış</span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 px-3 py-4 md:px-8 md:py-6 overflow-auto">
                    <Outlet />
                </main>
            </div>

            <CreateTaskModal
                projectId={selectedProjectId}
                sprintId={null}
                isOpen={isCreateOpen}
                onClose={() => setCreateOpen(false)}
            />
        </div>
    );
}