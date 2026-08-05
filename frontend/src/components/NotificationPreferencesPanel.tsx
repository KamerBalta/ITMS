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

    if (isLoading) return <p className="text-sm text-gray-400">Yükleniyor...</p>;

    return (
        <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-1">Bildirim Kanalları</h2>
            <p className="text-xs text-gray-400 mb-3">
                Her bildirim türü için uygulama içi ve e-posta kanallarını ayrı ayrı yönetin.
            </p>

            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-gray-400 text-xs">
                        <th className="pb-2">Tür</th>
                        <th className="pb-2 text-center">Uygulama İçi</th>
                        <th className="pb-2 text-center">E-posta</th>
                    </tr>
                </thead>
                <tbody>
                    {preferences?.map((p) => (
                        <tr key={p.notificationType} className="border-t">
                            <td className="py-2">{TYPE_LABELS[p.notificationType] ?? p.notificationType}</td>
                            <td className="py-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={p.inAppEnabled}
                                    onChange={(e) =>
                                        updatePreference.mutate({ type: p.notificationType, inApp: e.target.checked, email: p.emailEnabled })
                                    }
                                />
                            </td>
                            <td className="py-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={p.emailEnabled}
                                    onChange={(e) =>
                                        updatePreference.mutate({ type: p.notificationType, inApp: p.inAppEnabled, email: e.target.checked })
                                    }
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}