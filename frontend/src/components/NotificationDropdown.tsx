import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Bug,
    Rocket,
    MessageSquare,
    ClipboardList,
    CheckCheck,
} from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';

const TYPE_ICONS: Record<string, JSX.Element> = {
    Task: <ClipboardList className="w-4 h-4 text-blue-600" />,
    Sprint: <Bug className="w-4 h-4 text-green-600" />,
    Mention: <MessageSquare className="w-4 h-4 text-purple-600" />,
    Release: <Rocket className="w-4 h-4 text-orange-600" />,
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

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const { data: notifications } = useNotifications();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
    const recentNotifications = (notifications ?? []).slice(0, 6);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (n: { id: string; isRead: boolean; actionUrl: string | null }) => {
        if (!n.isRead) markAsRead.mutate(n.id);
        setIsOpen(false);
        if (n.actionUrl) navigate(n.actionUrl);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="relative text-gray-500 hover:text-gray-700 text-lg flex items-center justify-center p-1"
                aria-label="Bildirimler"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1 min-w-[16px] text-center leading-4">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-semibold">Bildirimler</span>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead.mutate()}
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Tümünü okundu işaretle
                            </button>
                        )}
                    </div>

                    {recentNotifications.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">Henüz bildiriminiz yok.</p>
                    ) : (
                        <div className="divide-y">
                            {recentNotifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleItemClick(n)}
                                    className={`w-full text-left px-3 py-2 hover:bg-slate-100 flex items-start gap-2 ${n.isRead ? '' : 'bg-indigo-50/50'
                                        }`}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        {TYPE_ICONS[n.type] ?? <Bell className="w-4 h-4 text-gray-500" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm truncate ${n.isRead ? 'font-normal' : 'font-semibold'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{n.message}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/notifications');
                        }}
                        className="w-full text-center text-sm text-indigo-600 hover:bg-slate-100 py-2 border-t font-medium"
                    >
                        Tüm Bildirimleri Gör
                    </button>
                </div>
            )}
        </div>
    );
}