export const KNOWN_SETTINGS: Record<string, { label: string; description: string }> = {
    MAX_FILE_SIZE_MB: { label: 'Maksimum Dosya Boyutu (MB)', description: 'Göreve yüklenebilecek tek dosyanın üst sınırı.' },
    DEFAULT_SPRINT_DURATION_DAYS: { label: 'Varsayılan Sprint Süresi (Gün)', description: 'Yeni sprint oluşturulurken önerilen süre.' },
    SESSION_TIMEOUT_MINUTES: { label: 'Oturum Zaman Aşımı (Dakika)', description: 'Access token geçerlilik süresi.' },
};