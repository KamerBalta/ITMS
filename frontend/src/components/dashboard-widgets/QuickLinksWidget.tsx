import { Link } from 'react-router-dom';

const LINKS = [
    { to: '/board', label: '📋 Board', desc: 'Aktif sprint kartları' },
    { to: '/backlog', label: '📥 Backlog', desc: 'Planlanmamış görevler' },
    { to: '/issues', label: '📃 Issue Listesi', desc: 'Tüm görevler, filtrelenebilir' },
    { to: '/roadmap', label: '🗺️ Roadmap', desc: 'Epic zaman çizelgesi' },
    { to: '/reports', label: '📊 Raporlar', desc: 'Sprint ve proje raporları' },
    { to: '/retrospective', label: '🔄 Retrospective', desc: 'Sprint değerlendirmesi' },
];

export function QuickLinksWidget() {
    return (
        <div className="grid grid-cols-2 gap-2">
            {LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover-surface">
                    <p className="text-sm font-medium text-primary">{link.label}</p>
                    <p className="text-xs text-muted">{link.desc}</p>
                </Link>
            ))}
        </div>
    );
}