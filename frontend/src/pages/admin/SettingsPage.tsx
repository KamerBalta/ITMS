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

    if (isLoading) return <p className="text-gray-500 text-sm p-4">Yükleniyor...</p>;

    const knownEntries = settings?.filter((s) => KNOWN_SETTINGS[s.key]) ?? [];
    const customEntries = settings?.filter((s) => !KNOWN_SETTINGS[s.key]) ?? [];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-600" />
                        Ayarlar
                    </h1>
                    <p className="text-sm text-gray-500">Sistem davranışlarını ve varsayılan parametreleri yönetin.</p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1.5 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Yeni Ayar
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs font-medium">❌ {error}</div>}

            {/* BİLİNEN AYARLAR KARTI */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Sistem Parametreleri
                </div>

                <div className="divide-y divide-gray-100">
                    {knownEntries.map((s) => {
                        const meta = KNOWN_SETTINGS[s.key];
                        return (
                            <div key={s.id} className="px-6 py-5 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-sm text-gray-900">{meta?.label || s.key}</p>
                                    <p className="text-xs text-gray-500">{meta?.description || 'Açıklama bulunmuyor.'}</p>
                                    {s.updatedByName && (
                                        <p className="text-[11px] text-gray-400 pt-1">
                                            Son güncelleyen: <span className="font-medium text-gray-600">{s.updatedByName}</span>
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
                                                className="border rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSave(s.key)}
                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700"
                                            >
                                                Kaydet
                                            </button>
                                            <button
                                                onClick={() => setEditingKey(null)}
                                                className="border px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                            >
                                                İptal
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Mevcut değer</p>
                                            </div>

                                            <button
                                                onClick={() => startEditing(s.key, s.value)}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
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
                <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden space-y-1">
                    <div className="bg-slate-50 px-6 py-3 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Özel Ayarlar
                    </div>

                    <div className="divide-y divide-gray-100">
                        {customEntries.map((s) => (
                            <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                                <span className="font-mono text-xs font-bold text-gray-700">{s.key}</span>

                                {editingKey === s.key ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            className="border rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSave(s.key)}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700"
                                        >
                                            Kaydet
                                        </button>
                                        <button
                                            onClick={() => setEditingKey(null)}
                                            className="border px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-gray-900 text-sm">{s.value}</span>
                                        <button
                                            onClick={() => startEditing(s.key, s.value)}
                                            className="text-xs text-indigo-600 hover:underline font-semibold"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => deleteSetting.mutate(s.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
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
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ayar Anahtarı (Key)</label>
                        <input
                            type="text"
                            placeholder="Örn: MAX_LOGIN_ATTEMPTS"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            required
                            className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Boşluklar otomatik olarak alt çizgiye (_) dönüştürülür.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Değer (Value)</label>
                        <input
                            type="text"
                            placeholder="Ayar değerini girin"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            required
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={upsertSetting.isPending}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {upsertSetting.isPending ? 'Ekleniyor...' : 'Ekle'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}