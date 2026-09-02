import { useNotificationPreferences, useUpdateNotificationPreference } from '../hooks/useNotifications';

const TYPE_LABELS: Record<string, string> = {
    Task: 'Görev Bildirimleri', Sprint: 'Sprint Bildirimleri', Mention: '@Mention Bildirimleri', Release: 'Release Bildirimleri',
};

export function NotificationPreferencesPanel() {
    const { data: preferences, isLoading } = useNotificationPreferences();
    const updatePreference = useUpdateNotificationPreference();

    if (isLoading) return <p className="text-sm text-muted">Yükleniyor...</p>;

    return (
        <div className="surface border rounded-lg p-4">
            <h2 className="font-semibold text-primary mb-1">Bildirim Kanalları</h2>
            <p className="text-xs text-muted mb-3">
                "Yalnızca Önemli" açıksa; durum değişikliği, mention ve atama gibi kritik olaylar dışındaki (hatırlatma, özet gibi)
                bildirimler bu türde tamamen gönderilmez — hiçbir kanaldan.
            </p>

            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-muted text-xs">
                        <th className="pb-2">Tür</th>
                        <th className="pb-2 text-center">Uygulama İçi</th>
                        <th className="pb-2 text-center">E-posta</th>
                        <th className="pb-2 text-center">Sıklık</th>
                        <th className="pb-2 text-center">Yalnızca Önemli</th>
                    </tr>
                </thead>
                <tbody>
                    {preferences?.map((p) => (
                        <tr key={p.notificationType} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="py-2 text-secondary">{TYPE_LABELS[p.notificationType] ?? p.notificationType}</td>
                            <td className="py-2 text-center">
                                <input type="checkbox" checked={p.inAppEnabled} onChange={(e) =>
                                    updatePreference.mutate({ type: p.notificationType, inApp: e.target.checked, email: p.emailEnabled, frequency: p.emailFrequency, onlyImportant: p.onlyImportantChanges })
                                } />
                            </td>
                            <td className="py-2 text-center">
                                <input type="checkbox" checked={p.emailEnabled} onChange={(e) =>
                                    updatePreference.mutate({ type: p.notificationType, inApp: p.inAppEnabled, email: e.target.checked, frequency: p.emailFrequency, onlyImportant: p.onlyImportantChanges })
                                } />
                            </td>
                            <td className="py-2 text-center">
                                <select
                                    value={p.emailFrequency} disabled={!p.emailEnabled}
                                    onChange={(e) => updatePreference.mutate({ type: p.notificationType, inApp: p.inAppEnabled, email: p.emailEnabled, frequency: e.target.value, onlyImportant: p.onlyImportantChanges })}
                                    className="text-xs input-base border rounded px-1 py-0.5 disabled:opacity-40"
                                >
                                    <option value="Instant">Anlık</option>
                                    <option value="DailyDigest">Günlük Özet</option>
                                </select>
                            </td>
                            <td className="py-2 text-center">
                                <input type="checkbox" checked={p.onlyImportantChanges} onChange={(e) =>
                                    updatePreference.mutate({ type: p.notificationType, inApp: p.inAppEnabled, email: p.emailEnabled, frequency: p.emailFrequency, onlyImportant: e.target.checked })
                                } />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}