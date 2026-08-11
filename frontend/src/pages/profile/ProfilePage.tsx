import { useState, useRef, useEffect } from 'react';
import {
    useMyProfile,
    useUpdateMyProfile,
    useChangeMyPassword,
    useUploadAvatar,
    useDeleteAvatar,
} from '../../hooks/useMyProfile';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { NotificationPreferencesPanel } from '../../components/NotificationPreferencesPanel';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { Camera, CheckCircle2, X, Lock, User, Sliders, Trash2 } from 'lucide-react';

const ROLE_BADGE_COLORS: Record<string, string> = {
    'System Admin': 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900',
    'Project Manager': 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    'Developer': 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    'QA/Tester': 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900',
};

export function ProfilePage() {
    const { data: profile, isLoading } = useMyProfile();
    const updateProfile = useUpdateMyProfile();
    const changePassword = useChangeMyPassword();
    const uploadAvatar = useUploadAvatar();
    const deleteAvatar = useDeleteAvatar();
    const refreshAvatar = useAuthStore((state) => state.refreshAvatar);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profil Form State
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [avatarVersion, setAvatarVersion] = useState(0);

    // Parola Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Tercihler (Preferences) State
    const { theme, setTheme } = useThemeStore();
    const [language, setLanguage] = useState('tr');
    const [timezone, setTimeZone] = useState('Europe/Istanbul');

    // Hata & Toast State'leri
    const [profileError, setProfileError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setTitle(profile.title ?? '');
        }
    }, [profile]);

    if (isLoading || !profile) return <p className="text-secondary text-sm p-4">Yükleniyor...</p>;

    // Profil Güncelleme
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError(null);
        try {
            await updateProfile.mutateAsync({ name, title: title || null });
            showToast('✓ Profil bilgileri başarıyla güncellendi.');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setProfileError(axiosError.response?.data?.message ?? 'Profil güncellenemedi.');
        }
    };

    // Şifre Değiştirme
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        if (newPassword !== confirmPassword) {
            setPasswordError('Yeni parolalar birbiriyle uyuşmuyor.');
            return;
        }

        try {
            await changePassword.mutateAsync({ currentPassword, newPassword });
            showToast('✓ Parolanız başarıyla değiştirildi.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setPasswordError(
                axiosError.response?.data?.message ??
                axiosError.response?.data?.errors?.map((x) => x.message).join(', ') ??
                'Parola değiştirilemedi.'
            );
        }
    };

    // Fotoğraf Seçme
    const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await uploadAvatar.mutateAsync(file);
            refreshAvatar();
            setAvatarVersion((v) => v + 1);
            showToast('✓ Profil fotoğrafı güncellendi.');
        } catch {
            alert('Avatar yüklenemedi (Yalnızca PNG veya JPG, en fazla 5MB).');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Fotoğraf Silme
    const handleDeleteAvatar = async () => {
        if (!confirm('Profil fotoğrafını kaldırmak istediğinize emin misiniz?')) return;

        try {
            await deleteAvatar.mutateAsync();
            refreshAvatar();
            setAvatarVersion((v) => v + 1);
            showToast('✓ Profil fotoğrafı kaldırıldı.');
        } catch {
            alert('Profil fotoğrafı silinemedi.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 relative">
            {/* Toast Bildirimi */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-[100000] bg-emerald-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                    <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white ml-2 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Başlık */}
            <div>
                <h1 className="text-2xl font-bold text-primary">Profilim</h1>
                <p className="text-sm text-secondary">Kişisel bilgilerinizi, güvenlik ayarlarınızı ve tercihlerinizi yönetin.</p>
            </div>

            {/* 1. ÜST HEADER / PROFIL KARTI */}
            <div className="surface border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-inner">
                        {profile.avatarUrl ? (
                            <AuthenticatedImage
                                src={`/users/${profile.id}/avatar`}
                                refreshKey={avatarVersion}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                                fallback={
                                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </span>
                                }
                            />
                        ) : (
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                {profile.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-xl font-bold text-primary">{profile.name}</h2>
                            <p className="text-sm font-medium text-secondary">{profile.title || 'Unvan Belirtilmedi'}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center justify-center gap-1.5 surface-muted hover-surface text-secondary text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-gray-200 dark:border-gray-700 cursor-pointer"
                            >
                                <Camera className="w-3.5 h-3.5 text-muted" />
                                Fotoğrafı Güncelle
                            </button>

                            {profile.avatarUrl && (
                                <button
                                    onClick={handleDeleteAvatar}
                                    disabled={deleteAvatar.isPending}
                                    className="inline-flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-red-200 dark:border-red-900/60 disabled:opacity-50 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                                    {deleteAvatar.isPending ? 'Siliniyor...' : 'Fotoğrafı Kaldır'}
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={handleAvatarSelected}
                            className="hidden"
                        />
                    </div>

                    <p className="text-xs text-muted font-mono">{profile.email}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                        {(profile.systemRoles ?? []).map((r) => (
                            <span
                                key={r}
                                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${ROLE_BADGE_COLORS[r] ?? 'surface-muted text-secondary border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {r}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. KİŞİSEL BİLGİLER FORMU */}
            <form onSubmit={handleSaveProfile} className="surface border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 text-primary font-bold text-base">
                    <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2>Kişisel Bilgiler</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Ad Soyad</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Unvan</label>
                        <input
                            type="text"
                            placeholder="Örn: Senior Software Engineer"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">E-posta</label>
                    <div className="text-sm font-medium text-muted surface-muted border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                        {profile.email}
                    </div>
                </div>

                {profileError && <p className="text-red-500 dark:text-red-400 text-xs font-medium">{profileError}</p>}

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                    >
                        {updateProfile.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </form>

            {/* 3. GÜVENLİK VE PAROLA DEĞİŞTİRME FORMU */}
            <form onSubmit={handleChangePassword} className="surface border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 text-primary font-bold text-base">
                    <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2>Güvenlik & Parola Değiştir</h2>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Mevcut Parola</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-secondary mb-1">Yeni Parola</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-secondary mb-1">Yeni Parola Tekrar</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                            />
                        </div>
                    </div>
                </div>

                {passwordError && <p className="text-red-500 dark:text-red-400 text-xs font-medium">{passwordError}</p>}

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={changePassword.isPending}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                    >
                        {changePassword.isPending ? 'Güncelleniyor...' : 'Parolayı Güncelle'}
                    </button>
                </div>
            </form>

            {/* Notification Preferences Panel (Detaylı Bildirim Yönetimi) */}
            <NotificationPreferencesPanel />

            {/* 4. SİSTEM TERCİHLERİ */}
            <div className="surface border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 text-primary font-bold text-base">
                    <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2>Sistem Tercihleri</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    {/* Tema Seçimi */}
                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1.5">Tema</label>
                        <select
                            value={theme}
                            onChange={(e) =>
                                setTheme(e.target.value as 'light' | 'dark')
                            }
                            className="w-full input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 cursor-pointer"
                        >
                            <option value="light">Açık Tema (Light)</option>
                            <option value="dark">Koyu Tema (Dark)</option>
                        </select>
                    </div>

                    {/* Dil Seçimi */}
                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1.5">Dil</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 cursor-pointer"
                        >
                            <option value="tr">Türkçe</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    {/* Saat Dilimi */}
                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1.5">Saat Dilimi</label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimeZone(e.target.value)}
                            className="w-full input-base border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 cursor-pointer"
                        >
                            <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                            <option value="UTC">UTC (GMT+0)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}