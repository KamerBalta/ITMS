export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    actionUrl: string | null;
}
export interface NotificationPreference {
    notificationType: string;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    emailFrequency: 'Instant' | 'DailyDigest';
}