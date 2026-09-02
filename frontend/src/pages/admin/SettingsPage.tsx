import { useState } from 'react';
import { useSettings, useUpsertSetting, useDeleteSetting } from '../../hooks/useSettings';
import { KNOWN_SETTINGS } from '../../lib/knownSettings';
import { Modal } from '../../components/Modal';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { Settings, Plus, Trash2, Edit2 } from 'lucide-react';

export function SettingsPage() {
    const { data: settings, isLoading } = useSettings();
    const upsertSetting = useUpsertSetting();
    const deleteSetting = useDeleteSetting();

    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Yeni Ayar Ekleme Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const startEditing = (key: string, value: string) => {
        setEditingKey(key);
        setEditingValue(value);
        setError(null);
    };

    const handleSave = async (key: string) => {
        setError(null);
        try {
            await upsertSetting.mutateAsync({ key, value: editingValue });
            setEditingKey(null);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Güncellenemedi.');
        }
    };

    const handleAddCustom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!newKey.trim() || !newValue.trim()) return;
        try {
            await upsertSetting.mutateAsync({ key: newKey.toUpperCase().replace(/\s+/g, '_'), value: newValue });
            setNewKey('');
            setNewValue('');
            setIsAddModalOpen(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Eklenemedi.');
        }
    };

    if (isLoading) return <p className="text-secondary text-sm p-4">Yükleniyor...</p>;

    const knownEntries = settings?.filter((s) => KNOWN_SETTINGS[s.key]) ?? [];
    const customEntries = settings?.filter((s) => !KNOWN_SETTINGS[s.key]) ?? [];

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Ayarlar
                    </h1>
                    <p className="text-sm text-secondary">Sistem davranışlarını ve varsayılan parametreleri yönetin.</p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Yeni Ayar
                </button>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-lg text-xs font-medium">❌ {error}</div>}

            {/* BİLİNEN AYARLAR KARTI */}
            <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs overflow-hidden">
                <div className="surface-muted px-6 py-3 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-muted uppercase tracking-wider">
                    Sistem Parametreleri
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {knownEntries.map((s) => {
                        const meta = KNOWN_SETTINGS[s.key];
                        return (
                            <div key={s.id} className="px-6 py-5 hover-surface transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-sm text-primary">{meta?.label || s.key}</p>
                                    <p className="text-xs text-secondary">{meta?.description || 'Açıklama bulunmuyor.'}</p>
                                    {s.updatedByName && (
                                        <p className="text-[11px] text-muted pt-1">
                                            Son güncelleyen: <span className="font-medium text-secondary">{s.updatedByName}</span>
                                            {s.updatedAt && ` · ${new Date(s.updatedAt).toLocaleString('tr-TR')}`}
                                        </p>
                                    )}
                                </div>

                                {/* Sağ Alan: Değer ve Düzenleme */}
                                <div className="shrink-0 flex items-center gap-4">
                                    {editingKey === s.key ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                className="input-base border rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSave(s.key)}
                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                                            >
                                                Kaydet
                                            </button>
                                            <button
                                                onClick={() => setEditingKey(null)}
                                                className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover-surface cursor-pointer"
                                            >
                                                İptal
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-bold text-primary text-sm">{s.value}</p>
                                                <p className="text-[10px] text-muted font-medium">Mevcut değer</p>
                                            </div>

                                            <button
                                                onClick={() => startEditing(s.key, s.value)}
                                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" /> Düzenle
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ÖZEL AYARLAR KARTI */}
            {customEntries.length > 0 && (
                <div className="surface border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs overflow-hidden space-y-1">
                    <div className="surface-muted px-6 py-3 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-muted uppercase tracking-wider">
                        Özel Ayarlar
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {customEntries.map((s) => (
                            <div key={s.id} className="px-6 py-4 flex items-center justify-between hover-surface transition">
                                <span className="font-mono text-xs font-bold text-secondary">{s.key}</span>

                                {editingKey === s.key ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            className="input-base border rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSave(s.key)}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                                        >
                                            Kaydet
                                        </button>
                                        <button
                                            onClick={() => setEditingKey(null)}
                                            className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary hover-surface cursor-pointer"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-primary text-sm">{s.value}</span>
                                        <button
                                            onClick={() => startEditing(s.key, s.value)}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => deleteSetting.mutate(s.id)}
                                            className="p-1.5 text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition cursor-pointer"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* YENİ AYAR EKLEME MODALI */}
            <Modal title="Yeni Özel Ayar Ekle" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <form onSubmit={handleAddCustom} className="space-y-4 max-w-md w-full">
                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Ayar Anahtarı (Key)</label>
                        <input
                            type="text"
                            placeholder="Örn: MAX_LOGIN_ATTEMPTS"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            required
                            className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                        />
                        <p className="text-[11px] text-muted mt-1">Boşluklar otomatik olarak alt çizgiye (_) dönüştürülür.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Değer (Value)</label>
                        <input
                            type="text"
                            placeholder="Ayar değerini girin"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            required
                            className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover-surface text-secondary cursor-pointer"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={upsertSetting.isPending}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                        >
                            {upsertSetting.isPending ? 'Ekleniyor...' : 'Ekle'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}