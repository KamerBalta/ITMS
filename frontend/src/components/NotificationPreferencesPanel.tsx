import { useNotificationPreferences, useUpdateNotificationPreference } from '../hooks/useNotifications';

const TYPE_LABELS: Record<string, string> = {
    Task: 'Görev Bildirimleri',
    Sprint: 'Sprint Bildirimleri',
    Mention: '@Mention Bildirimleri',
    Release: 'Release Bildirimleri',
};

export function NotificationPreferencesPanel() {
    const { data: preferences, isLoading } = useNotificationPreferences();
    const updatePreference = useUpdateNotificationPreference();

    if (isLoading) return <p className="text-sm text-muted">Yükleniyor...</p>;

    return (
        <div className="surface border rounded-lg p-4">
            <h2 className="font-semibold mb-1 text-primary">Bildirim Kanalları</h2>
            <p className="text-xs text-muted mb-3">
                Her bildirim türü için uygulama içi, e-posta kanallarını ve e-posta sıklığını ayrı ayrı yönetin.
            </p>

            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-muted text-xs">
                        <th className="pb-2">Tür</th>
                        <th className="pb-2 text-center">Uygulama İçi</th>
                        <th className="pb-2 text-center">E-posta</th>
                        <th className="pb-2 text-center">Sıklık</th>
                    </tr>
                </thead>
                <tbody>
                    {preferences?.map((p) => (
                        <tr key={p.notificationType} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="py-2 text-secondary">{TYPE_LABELS[p.notificationType] ?? p.notificationType}</td>
                            <td className="py-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={p.inAppEnabled}
                                    onChange={(e) =>
                                        updatePreference.mutate({
                                            type: p.notificationType,
                                            inApp: e.target.checked,
                                            email: p.emailEnabled,
                                            frequency: p.emailFrequency,
                                        })
                                    }
                                    className="cursor-pointer rounded"
                                />
                            </td>
                            <td className="py-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={p.emailEnabled}
                                    onChange={(e) =>
                                        updatePreference.mutate({
                                            type: p.notificationType,
                                            inApp: p.inAppEnabled,
                                            email: e.target.checked,
                                            frequency: p.emailFrequency,
                                        })
                                    }
                                    className="cursor-pointer rounded"
                                />
                            </td>
                            <td className="py-2 text-center">
                                <select
                                    value={p.emailFrequency}
                                    disabled={!p.emailEnabled}
                                    onChange={(e) =>
                                        updatePreference.mutate({
                                            type: p.notificationType,
                                            inApp: p.inAppEnabled,
                                            email: p.emailEnabled,
                                            frequency: e.target.value,
                                        })
                                    }
                                    className="text-xs input-base border rounded px-1.5 py-0.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <option value="Instant">Anlık</option>
                                    <option value="DailyDigest">Günlük Özet</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}