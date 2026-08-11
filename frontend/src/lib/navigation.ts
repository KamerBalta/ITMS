import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    FolderKanban,
    KanbanSquare,
    ListTodo,
    List,
    Rocket,
    MessagesSquare,
    UserCheck,
    Users,
    BarChart3,
    Shield,
    Settings,
    Tag
} from 'lucide-react';

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    adminOnly?: boolean;
    section: 'YOUR_WORK' | 'PROJECT_PLANNING' | 'TEAMS_REPORTS' | 'SETTINGS';
}

export const navItems: NavItem[] = [
    // 1. KİŞİSEL ÇALIŞMA (YOUR WORK)
    {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        section: 'YOUR_WORK'
    },
    {
        label: 'Bana Atananlar',
        path: '/my-work',
        icon: UserCheck,
        section: 'YOUR_WORK'
    },

    // 2. PROJE VE PLANLAMA (PROJECT PLANNING)
    {
        label: 'Projeler',
        path: '/projects',
        icon: FolderKanban,
        section: 'PROJECT_PLANNING'
    },
    {
        label: 'Board',
        path: '/board',
        icon: KanbanSquare,
        section: 'PROJECT_PLANNING'
    },
    {
        label: 'Backlog',
        path: '/backlog',
        icon: ListTodo,
        section: 'PROJECT_PLANNING'
    },
    {
        label: 'Roadmap',
        path: '/roadmap',
        icon: BarChart3,
        section: 'PROJECT_PLANNING'
    },
    {
        label: 'Issue Listesi',
        path: '/issues',
        icon: List,
        section: 'PROJECT_PLANNING'
    },
    {
        label: 'Release',
        path: '/releases',
        icon: Rocket,
        section: 'PROJECT_PLANNING'
    },
    {
        label: 'Retrospective',
        path: '/retrospective',
        icon: MessagesSquare,
        section: 'PROJECT_PLANNING'
    },

    // 3. TAKIM VE ANALİTİK (TEAMS & REPORTS)
    {
        label: 'Takımlar',
        path: '/teams',
        icon: Users,
        section: 'TEAMS_REPORTS'
    },
    {
        label: 'Raporlar',
        path: '/reports',
        icon: BarChart3,
        section: 'TEAMS_REPORTS'
    },

    // 4. YÖNETİM VE AYARLAR (SETTINGS)
    {
        label: 'Kullanıcı Yönetimi',
        path: '/admin/users',
        icon: Shield,
        adminOnly: true,
        section: 'SETTINGS'
    },
    {
        label: 'Sistem Ayarları',
        path: '/admin/settings',
        icon: Settings,
        adminOnly: true,
        section: 'SETTINGS'
    },
    {
        label: 'Issue Type Kataloğu',
        path: '/admin/issue-types',
        icon: Tag,
        adminOnly: true,
        section: 'SETTINGS'
    },
];