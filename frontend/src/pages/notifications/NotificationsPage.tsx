import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    useNotifications,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
} from '../../hooks/useNotifications';
import {
    Search,
    CheckCheck,
    Trash2,
    Check,
    ArrowLeft,
    CheckSquare,
    Zap,
    AtSign,
    Rocket,
    Bell
} from 'lucide-react';

const TYPE_BADGES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    Task: { label: 'TASK', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900', icon: CheckSquare },
    Sprint: { label: 'SPRINT', color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900', icon: Zap },
    Mention: { label: 'MENTION', color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900', icon: AtSign },
    Release: { label: 'RELEASE', color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900', icon: Rocket },
};

function timeAgo(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} sa önce`;
    return new Date(dateStr).toLocaleDateString('tr-TR');
}

// Tarih Gruplama Yardımcısı
function getGroupKey(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Bugün';
    if (isYesterday) return 'Dün';
    return 'Daha Önce';
}

export function NotificationsPage() {
    const navigate = useNavigate();
    const { data: notifications, isLoading } = useNotifications();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

    // Filtreleme Mantığı
    const filteredNotifications = useMemo(() => {
        if (!notifications) return [];

        return notifications.filter((n) => {
            const matchesSearch =
                n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (n.taskKey && n.taskKey.toLowerCase().includes(searchQuery.toLowerCase()));

            let matchesTab = true;
            if (selectedFilter === 'unread') matchesTab = !n.isRead;
            else if (selectedFilter === 'task') matchesTab = n.type === 'Task';
            else if (selectedFilter === 'mention') matchesTab = n.type === 'Mention';
            else if (selectedFilter === 'sprint') matchesTab = n.type === 'Sprint';
            else if (selectedFilter === 'release') matchesTab = n.type === 'Release';

            return matchesSearch && matchesTab;
        });
    }, [notifications, searchQuery, selectedFilter]);

    // Tarihe Göre Gruplama (Bugün, Dün, Daha Önce)
    const groupedNotifications = useMemo(() => {
        const groups: Record<string, typeof filteredNotifications> = {
            Bugün: [],
            Dün: [],
            'Daha Önce': [],
        };

        filteredNotifications.forEach((n) => {
            const key = getGroupKey(n.createdAt);
            if (!groups[key]) groups[key] = [];
            groups[key].push(n);
        });

        return groups;
    }, [filteredNotifications]);

    // Bildirime Tıklama Eylemi
    const handleNotificationClick = (n: any) => {
        if (!n.isRead) {
            markAsRead.mutate(n.id);
        }

        if (n.actionUrl) {
            navigate(n.actionUrl);
        } else if (n.taskId) {
            navigate(`/tasks/${n.taskId}`);
        } else if (n.projectId) {
            navigate(`/projects/${n.projectId}`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Üst Başlık & Eylemler */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Bildirimler</h1>
                    <p className="text-sm text-secondary">Aktiviteler, atamalar ve güncellemeler.</p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsRead.mutate()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Tümünü Okundu İşaretle ({unreadCount})
                    </button>
                )}
            </div>

            {/* Arama Barı ve Filtre Tabları */}
            <div className="surface p-3 border rounded-xl shadow-sm space-y-3">
                {/* Arama Barı */}
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                    <input
                        type="text"
                        placeholder="Bildirimlerde ara veya görev anahtarı yaz (Örn: PROJ-12)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full input-base border rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                    />
                </div>

                {/* Tab Filtreleri */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1">
                    {[
                        { id: 'all', label: 'Tümü' },
                        { id: 'unread', label: `Okunmayanlar (${unreadCount})` },
                        { id: 'task', label: 'Görevler' },
                        { id: 'mention', label: 'Mention' },
                        { id: 'sprint', label: 'Sprint' },
                        { id: 'release', label: 'Release' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${selectedFilter === tab.id
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-secondary hover-surface'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bildirim Listesi */}
            {isLoading ? (
                <div className="p-8 text-center text-secondary text-sm">Bildirimler yükleniyor...</div>
            ) : filteredNotifications.length === 0 ? (
                <div className="p-12 text-center text-muted surface border rounded-xl shadow-sm text-sm">
                    Henüz gösterilecek bildirim bulunmuyor.
                </div>
            ) : (
                <div className="surface border rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                    {Object.entries(groupedNotifications).map(([groupTitle, items]) => {
                        if (items.length === 0) return null;

                        return (
                            <div key={groupTitle}>
                                {/* Tarih Grubu Başlığı */}
                                <div className="surface-muted px-4 py-2 text-xs font-bold text-muted uppercase tracking-wider border-y border-gray-100 dark:border-gray-800">
                                    {groupTitle}
                                </div>

                                {/* Bildirim Satırları */}
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {items.map((n: any) => {
                                        const badge = TYPE_BADGES[n.type] ?? {
                                            label: 'BİLDİRİM',
                                            color: 'bg-gray-100 dark:bg-gray-800 text-secondary border-gray-200 dark:border-gray-700',
                                            icon: Bell,
                                        };

                                        const BadgeIcon = badge.icon;
                                        const senderName = n.actorName || n.userName || 'Sistem';
                                        const initials = senderName
                                            .split(' ')
                                            .map((x: string) => x[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2);

                                        const isClickable = Boolean(n.actionUrl || n.taskId || n.projectId);

                                        return (
                                            <div
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                className={`group relative flex items-start gap-3.5 p-4 transition ${isClickable ? 'cursor-pointer hover-surface' : ''
                                                    } ${!n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : 'surface'}`}
                                            >
                                                {/* Mavi Okunmadı Noktası */}
                                                {!n.isRead && (
                                                    <span className="absolute left-2 top-6 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                                                )}

                                                {/* Avatar */}
                                                {n.avatarUrl ? (
                                                    <img
                                                        src={n.avatarUrl}
                                                        alt={senderName}
                                                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200 dark:border-indigo-800">
                                                        {initials}
                                                    </div>
                                                )}

                                                {/* Bildirim İçeriği */}
                                                <div className="flex-1 min-w-0 pr-16">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-semibold text-primary text-sm">
                                                            {senderName}
                                                        </span>

                                                        {/* Tip Badge & Lucide İkonu */}
                                                        <span
                                                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold border ${badge.color}`}
                                                        >
                                                            <BadgeIcon className="w-3 h-3 shrink-0" />
                                                            <span>{badge.label}</span>
                                                        </span>

                                                        {/* Task Key Linki */}
                                                        {n.taskKey && (
                                                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                                {n.taskKey}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-sm font-semibold text-primary leading-snug">
                                                        {n.title}
                                                    </p>
                                                    {n.message && (
                                                        <p className="text-sm text-secondary leading-snug line-clamp-2 mt-0.5">
                                                            {n.message}
                                                        </p>
                                                    )}
                                                    <span className="text-xs text-muted mt-1 block">
                                                        {timeAgo(n.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Hover Durumında Görünür Olan Eylemler */}
                                                <div
                                                    className="absolute right-4 top-4 hidden group-hover:flex items-center gap-1 surface/90 backdrop-blur-xs p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {!n.isRead && (
                                                        <button
                                                            onClick={() => markAsRead.mutate(n.id)}
                                                            title="Okundu İşaretle"
                                                            className="p-1.5 text-secondary hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md transition cursor-pointer"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification.mutate(n.id)}
                                                        title="Sil"
                                                        className="p-1.5 text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Geri Dön Linki */}
            <div className="pt-2">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" /> Dashboard'a dön
                </Link>
            </div>
        </div>
    );
}