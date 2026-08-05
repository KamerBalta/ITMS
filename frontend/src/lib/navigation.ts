export interface NavItem {
    label: string;
    path: string;
    icon: string; // simdilik emoji/kisa metin -- gercek ikon kutuphanesini sonra baglariz
    adminOnly?: boolean;
}

export const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Projeler', path: '/projects', icon: '📁' },
    { label: 'Board', path: '/board', icon: '🗂️' },
    { label: 'Backlog', path: '/backlog', icon: '📋' },
    { label: 'Takımlar', path: '/teams', icon: '👥' },
    { label: 'Bildirimler', path: '/notifications', icon: '🔔' },
    { label: 'Kullanıcı Yönetimi', path: '/admin/users', icon: '🧑‍💼', adminOnly: true },
    { label: 'Sistem Ayarları', path: '/admin/settings', icon: '⚙️', adminOnly: true },
];