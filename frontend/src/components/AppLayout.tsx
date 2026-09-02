import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Search, Menu, X, Plus, LogOut, ChevronDown, User } from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { authApi } from '../api/auth';
import { navItems } from '../lib/navigation';

import { useNotifications } from '../hooks/useNotifications';
import { ProjectSelector } from './ProjectSelector';
import { CreateTaskModal } from './CreateTaskModal';
import { NotificationDropdown } from './NotificationDropdown';
import { RealtimeIndicator } from './RealtimeIndicator';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { GlobalSearchPopover } from './GlobalSearchPopover';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { ShortcutsHelpModal } from './ShortcutsHelpModal';
import { Avatar } from './Avatar';
import { OnboardingTour } from './OnboardingTour';
import { ChangelogModal } from './ChangelogModal';

import logoImg from '../assets/logo.png';

const SECTION_LABELS: Record<string, string> = {
    YOUR_WORK: 'YOUR WORK',
    PROJECT_PLANNING: 'PLANNING',
    TEAMS_REPORTS: 'TEAMS & ANALYTICS',
    SETTINGS: 'ADMINISTRATION',
};

const SECTION_ORDER = [
    'YOUR_WORK',
    'PROJECT_PLANNING',
    'TEAMS_REPORTS',
    'SETTINGS',
];

export function AppLayout() {
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const refreshToken = useAuthStore((state) => state.refreshToken);
    const logout = useAuthStore((state) => state.logout);

    const { data: notifications } = useNotifications();

    const {
        isMobileSidebarOpen,
        toggleMobileSidebar,
        closeMobileSidebar,
    } = useUIStore();

    const selectedProjectId = useProjectStore(
        (state) => state.selectedProjectId
    );

    const isAdmin = user?.roles.includes('System Admin') ?? false;

    const unreadCount =
        notifications?.filter((n) => !n.isRead).length ?? 0;

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isHelpOpen, setHelpOpen] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Global Search
    const [isSearchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Keyboard Shortcuts
    useKeyboardShortcuts({
        onCreateTask: () => setCreateOpen(true),
        onShowHelp: () => setHelpOpen(true),
    });

    // Realtime
    useRealtimeSync();

    // Dışarı tıklandığında profil menüsünü kapat
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target as Node)
            ) {
                setProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener(
                'mousedown',
                handleClickOutside
            );
        }

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };
    }, [isProfileOpen]);

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

    const visibleNavItems = navItems.filter(
        (item) =>
            (!item.adminOnly || isAdmin) &&
            item.path !== '/search'
    );

    return (
        <div
            className="
                min-h-screen
                flex
                bg-slate-50
                dark:bg-gray-950
                text-slate-800
                dark:text-gray-100
            "
        >
            {/* =====================================================
                MOBİL SIDEBAR OVERLAY
            ====================================================== */}

            {isMobileSidebarOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        bg-slate-900/40
                        backdrop-blur-xs
                        z-30
                        md:hidden
                        transition-opacity
                    "
                    onClick={closeMobileSidebar}
                />
            )}

            {/* =====================================================
                SIDEBAR
            ====================================================== */}

            <aside
                className={`
                    w-[232px]
                    surface
                    border-r
                    border-slate-200/80
                    dark:border-gray-800
                    flex
                    flex-col
                    fixed
                    md:static
                    inset-y-0
                    left-0
                    z-40
                    transition-transform
                    duration-200
                    select-none

                    ${isMobileSidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full md:translate-x-0'
                    }
                `}
            >
                {/* =================================================
                    LOGO
                ================================================== */}

                <div
                    className="
                        h-14
                        px-4
                        border-b
                        border-slate-100
                        dark:border-gray-800
                        flex
                        items-center
                        justify-between
                        shrink-0
                    "
                >
                    <Link
                        to="/dashboard"
                        className="
                            flex
                            items-center
                            gap-2.5
                            group
                            cursor-pointer
                        "
                        title="Dashboard'a git"
                    >
                        <img
                            src={logoImg}
                            alt="ITMS Logo"
                            className="
                                w-7
                                h-7
                                object-contain
                                shrink-0
                                transition-transform
                                group-hover:scale-105
                            "
                        />

                        <div className="flex flex-col">
                            <span
                                className="
                                    text-base
                                    font-bold
                                    text-primary
                                    leading-none
                                    group-hover:text-blue-600
                                    dark:group-hover:text-blue-400
                                    transition-colors
                                "
                            >
                                ITMS
                            </span>

                            <span
                                className="
                                    text-[9px]
                                    text-muted
                                    mt-1
                                    leading-none
                                "
                            >
                                Software Management
                            </span>
                        </div>
                    </Link>

                    {/* Mobil kapatma */}
                    <button
                        onClick={closeMobileSidebar}
                        className="
                            md:hidden
                            p-1.5
                            rounded-md
                            text-muted
                            hover:text-primary
                            hover-surface
                            transition
                        "
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* =================================================
                    OLUŞTUR BUTONU
                ================================================== */}

                <div
                    className="
                        px-3
                        py-3
                        border-b
                        border-slate-100
                        dark:border-gray-800
                        shrink-0
                    "
                >
                    <button
                        data-tour="sidebar-create"
                        onClick={() => setCreateOpen(true)}
                        className="
                            w-full
                            h-9
                            bg-blue-600
                            text-white
                            rounded-md
                            text-sm
                            font-medium
                            hover:bg-blue-700
                            active:bg-blue-800
                            transition
                            flex
                            items-center
                            justify-center
                            gap-2
                            shadow-sm
                            cursor-pointer
                        "
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Oluştur</span>
                    </button>
                </div>

                {/* =================================================
                    NAVIGATION
                ================================================== */}

                <nav
                    className="
                        flex-1
                        px-3
                        py-4
                        overflow-y-auto

                        [&::-webkit-scrollbar]:hidden
                        [-ms-overflow-style:none]
                        [scrollbar-width:none]
                    "
                >
                    {SECTION_ORDER.map((sectionKey) => {
                        const itemsInSection =
                            visibleNavItems.filter(
                                (item) =>
                                    (item.section ?? 'YOUR_WORK') ===
                                    sectionKey
                            );

                        if (itemsInSection.length === 0) {
                            return null;
                        }

                        return (
                            <div
                                key={sectionKey}
                                className="mb-5"
                            >
                                {/* Section başlığı */}
                                <div
                                    className="
                                        px-3
                                        mb-1
                                        text-[11px]
                                        font-semibold
                                        text-slate-500
                                        dark:text-gray-500
                                        uppercase
                                        tracking-wide
                                    "
                                >
                                    {SECTION_LABELS[sectionKey] ??
                                        sectionKey}
                                </div>

                                {/* Navigation Items */}
                                <div className="space-y-0.5">
                                    {itemsInSection.map((item) => {
                                        const IconComponent =
                                            item.icon;

                                        const tourId =
                                            item.path === '/board'
                                                ? 'sidebar-board'
                                                : item.path === '/backlog'
                                                    ? 'sidebar-backlog'
                                                    : undefined;

                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                data-tour={tourId}
                                                className={({
                                                    isActive,
                                                }) =>
                                                    `
                                                    flex
                                                    items-center
                                                    justify-between
                                                    px-3
                                                    py-2
                                                    rounded-md
                                                    text-sm
                                                    transition-colors
                                                    duration-150

                                                    ${isActive
                                                        ? `
                                                            bg-blue-50
                                                            dark:bg-blue-950/60
                                                            text-blue-700
                                                            dark:text-blue-300
                                                            font-semibold
                                                        `
                                                        : `
                                                            text-secondary
                                                            hover-surface
                                                            hover:text-primary
                                                        `
                                                    }
                                                    `
                                                }
                                            >
                                                <span
                                                    className="
                                                        flex
                                                        items-center
                                                        gap-3
                                                        min-w-0
                                                    "
                                                >
                                                    {IconComponent && (
                                                        <span
                                                            className="
                                                                shrink-0
                                                                flex
                                                                items-center
                                                                justify-center
                                                            "
                                                        >
                                                            <IconComponent
                                                                size={17}
                                                                strokeWidth={
                                                                    2
                                                                }
                                                            />
                                                        </span>
                                                    )}

                                                    <span className="truncate">
                                                        {item.label}
                                                    </span>
                                                </span>

                                                {/* Notification Badge */}
                                                {item.path ===
                                                    '/notifications' &&
                                                    unreadCount >
                                                    0 && (
                                                        <span
                                                            className="
                                                                bg-red-500
                                                                text-white
                                                                text-[10px]
                                                                font-bold
                                                                rounded-full
                                                                min-w-5
                                                                h-5
                                                                px-1
                                                                flex
                                                                items-center
                                                                justify-center
                                                                shrink-0
                                                            "
                                                        >
                                                            {unreadCount >
                                                                99
                                                                ? '99+'
                                                                : unreadCount}
                                                        </span>
                                                    )}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* =====================================================
                ANA ALAN
            ====================================================== */}

            <div className="flex-1 flex flex-col min-w-0">
                {/* =================================================
                    TOP HEADER
                ================================================== */}

                <header
                    className="
                        h-14
                        surface
                        border-b
                        border-slate-200
                        dark:border-gray-800
                        flex
                        items-center
                        justify-between
                        px-3
                        md:px-5
                        gap-2
                        sm:gap-4
                        shrink-0
                        relative
                        z-30
                    "
                >
                    {/* Sol taraf */}
                    <div
                        className="
                            flex
                            items-center
                            gap-2
                            sm:gap-3
                            min-w-0
                            flex-1
                        "
                    >
                        {/* Mobil hamburger */}
                        <button
                            onClick={toggleMobileSidebar}
                            className="
                                md:hidden
                                text-secondary
                                hover:text-primary
                                shrink-0
                                p-1.5
                                rounded-md
                                hover-surface
                                transition
                            "
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="min-w-0 shrink-0">
                            <ProjectSelector />
                        </div>

                        {/* Search */}
                        <div className="relative min-w-0">
                            {/* Desktop Search */}
                            <div
                                className="
                                    hidden
                                    lg:flex
                                    items-center
                                    gap-2
                                    surface-muted
                                    focus-within:surface
                                    focus-within:ring-2
                                    focus-within:ring-blue-500/20
                                    border
                                    border-slate-200
                                    dark:border-gray-700
                                    rounded-md
                                    px-3
                                    py-1.5
                                    w-72
                                    transition
                                "
                            >
                                <Search
                                    className="
                                        w-4
                                        h-4
                                        shrink-0
                                        text-muted
                                    "
                                />

                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(
                                            e.target.value
                                        );

                                        if (!isSearchOpen) {
                                            setSearchOpen(true);
                                        }
                                    }}
                                    onFocus={() =>
                                        setSearchOpen(true)
                                    }
                                    placeholder="Ara"
                                    className="
                                        text-xs
                                        text-primary
                                        placeholder:text-muted
                                        bg-transparent
                                        outline-none
                                        w-full
                                    "
                                />

                                {searchQuery ? (
                                    <button
                                        onClick={() =>
                                            setSearchQuery('')
                                        }
                                        className="
                                            text-muted
                                            hover:text-primary
                                            shrink-0
                                            cursor-pointer
                                        "
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <kbd
                                        className="
                                            text-[10px]
                                            bg-gray-100
                                            dark:bg-gray-700
                                            text-secondary
                                            px-1.5
                                            py-0.5
                                            rounded
                                            shrink-0
                                        "
                                    >
                                        Ctrl K
                                    </kbd>
                                )}
                            </div>

                            <button
                                data-tour="header-search"
                                onClick={() => navigate('/search')}
                                className="
                                    lg:hidden
                                    p-1.5
                                    rounded-md
                                    text-secondary
                                    hover:text-primary
                                    hover-surface
                                    transition
                                    shrink-0
                                    cursor-pointer
                                "
                                title="Arama yap"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            <GlobalSearchPopover
                                isOpen={isSearchOpen}
                                searchQuery={searchQuery}
                                onClose={() =>
                                    setSearchOpen(false)
                                }
                            />
                        </div>
                    </div>

                    {/* Sağ taraf */}
                    <div
                        className="
                            flex
                            items-center
                            gap-1
                            sm:gap-2
                            shrink-0
                        "
                    >
                        <RealtimeIndicator />

                        <NotificationDropdown />

                        <div
                            ref={profileRef}
                            className="relative"
                        >
                            <button
                                onClick={() => setProfileOpen((prev) => !prev)}
                                className="
                                    flex
                                    items-center
                                    gap-1.5
                                    p-1
                                    rounded-md
                                    hover:bg-slate-100
                                    dark:hover:bg-gray-800
                                    transition
                                    cursor-pointer
                                "
                                title={user?.email}
                            >
                                <Avatar
                                    userId={user?.userId ?? ''}
                                    name={user?.userName ?? user?.email ?? 'User'}
                                    size="md"
                                />

                                <ChevronDown
                                    className={`
                                        hidden
                                        sm:block
                                        w-3.5
                                        h-3.5
                                        text-muted
                                        transition-transform
                                        duration-150
                                        ${isProfileOpen ? 'rotate-180' : ''}
                                    `}
                                />
                            </button>

                            {isProfileOpen && (
                                <div
                                    className="
                                        absolute
                                        right-0
                                        top-[calc(100%+8px)]
                                        w-64
                                        surface
                                        border
                                        border-slate-200
                                        dark:border-gray-700
                                        rounded-lg
                                        shadow-lg
                                        py-1.5
                                        z-50
                                        overflow-hidden
                                    "
                                >
                                    {/* Kullanıcı Bilgisi */}
                                    <div
                                        className="
                                            px-4
                                            py-3
                                            border-b
                                            border-slate-100
                                            dark:border-gray-800
                                        "
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                userId={user?.userId ?? ''}
                                                name={user?.userName ?? user?.email ?? 'User'}
                                                size="lg"
                                            />

                                            <div className="min-w-0">
                                                <p
                                                    className="
                                                        text-sm
                                                        font-semibold
                                                        text-primary
                                                        truncate
                                                    "
                                                >
                                                    {user?.userName || 'Kullanıcı'}
                                                </p>

                                                <p
                                                    className="
                                                        text-xs
                                                        text-muted
                                                        truncate
                                                        mt-0.5
                                                    "
                                                >
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menü */}
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                navigate('/profile');
                                            }}
                                            className="
                                                w-full
                                                flex
                                                items-center
                                                gap-3
                                                px-4
                                                py-2.5
                                                text-sm
                                                text-secondary
                                                hover-surface
                                                hover:text-primary
                                                transition
                                                text-left
                                                cursor-pointer
                                            "
                                        >
                                            <User className="w-4 h-4 shrink-0" />
                                            <span>Profil</span>
                                        </button>
                                    </div>

                                    {/* Çıkış */}
                                    <div
                                        className="
                                            border-t
                                            border-slate-100
                                            dark:border-gray-800
                                            pt-1
                                        "
                                    >
                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                handleLogout();
                                            }}
                                            className="
                                                w-full
                                                flex
                                                items-center
                                                gap-3
                                                px-4
                                                py-2.5
                                                text-sm
                                                text-red-600
                                                dark:text-red-400
                                                hover:bg-red-50
                                                dark:hover:bg-red-950/40
                                                transition
                                                text-left
                                                cursor-pointer
                                            "
                                        >
                                            <LogOut className="w-4 h-4 shrink-0" />
                                            <span>Çıkış yap</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main
                    className="
                        flex-1
                        px-4
                        py-5
                        md:px-6
                        md:py-6
                        overflow-auto
                    "
                >
                    <Outlet />
                </main>
            </div>

            <CreateTaskModal
                projectId={selectedProjectId}
                sprintId={null}
                isOpen={isCreateOpen}
                onClose={() => setCreateOpen(false)}
            />

            <ShortcutsHelpModal
                isOpen={isHelpOpen}
                onClose={() => setHelpOpen(false)}
            />

            <OnboardingTour />
            <ChangelogModal />
        </div>
    );
}