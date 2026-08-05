import { useState, useEffect } from 'react';
import {
    useIssueTypes,
    useCreateIssueType,
    useUpdateIssueType,
    useToggleIssueTypeActive,
    useDeleteIssueType,
} from '../../hooks/useIssueTypes';
import { Modal } from '../../components/Modal';
import type { GlobalIssueType } from '../../types/issueType';
import type { IssueTypePayload } from '../../api/issueTypes';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const CREATOR_TIER_LABELS: Record<number, string> = { 0: 'Herkes', 1: 'Developer ve üstü', 2: 'Yalnızca PM/Admin' };

export function IssueTypeCatalogPage() {
    const { data: types, isLoading } = useIssueTypes(false);
    const toggleActive = useToggleIssueTypeActive();
    const deleteType = useDeleteIssueType();

    const [isFormOpen, setFormOpen] = useState(false);
    const [editingType, setEditingType] = useState<GlobalIssueType | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (type: GlobalIssueType) => {
        setError(null);
        if (!confirm(`"${type.name}" tipini global katalogdan silmek istediğinize emin misiniz?`)) return;
        try {
            await deleteType.mutateAsync(type.id);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Silinemedi.');
        }
    };

    return (
        <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Issue Type Kataloğu</h1>
                    <p className="text-sm text-gray-400">Sistem genelinde tanımlı, projelerin seçebileceği tipler.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingType(null);
                        setFormOpen(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                >
                    + Yeni Tip
                </button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {isLoading ? (
                <p className="text-gray-500">Yükleniyor...</p>
            ) : (
                <div className="bg-white border rounded-lg divide-y">
                    {types?.map((type) => (
                        <div key={type.id} className={`p-4 flex items-center gap-3 ${!type.isActive ? 'opacity-50' : ''}`}>
                            <span className="text-xl">{type.icon || '📄'}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{type.name}</span>
                                    {type.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />}
                                    {type.isSystemDefault && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Sistem</span>}
                                    {!type.isActive && <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">Pasif</span>}
                                </div>
                                {type.description && <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>}
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {CREATOR_TIER_LABELS[type.creatorTier]}
                                    {type.allowsChildren && ' · Üst görev olabilir'}
                                    {type.requiresParent && ' · Üst göreve bağlı olmalı'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => toggleActive.mutate(type.id)}
                                    className={`text-xs px-2 py-1 rounded border ${type.isActive ? 'border-gray-200 text-gray-600' : 'border-green-200 text-green-600'}`}
                                >
                                    {type.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingType(type);
                                        setFormOpen(true);
                                    }}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Düzenle
                                </button>
                                {!type.isSystemDefault && (
                                    <button onClick={() => handleDelete(type)} className="text-xs text-red-500 hover:underline">
                                        Sil
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <IssueTypeFormModal isOpen={isFormOpen} editingType={editingType} onClose={() => setFormOpen(false)} />
        </div>
    );
}

const EMPTY_FORM: IssueTypePayload = { name: '', description: '', icon: '', color: '#6366f1', creatorTier: 0, allowsChildren: false, requiresParent: false };

function IssueTypeFormModal({
    isOpen,
    editingType,
    onClose,
}: {
    isOpen: boolean;
    editingType: GlobalIssueType | null;
    onClose: () => void;
}) {
    const createType = useCreateIssueType();
    const updateType = useUpdateIssueType();
    const [form, setForm] = useState<IssueTypePayload>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setForm(
                editingType
                    ? {
                        name: editingType.name,
                        description: editingType.description ?? '',
                        icon: editingType.icon ?? '',
                        color: editingType.color ?? '#6366f1',
                        creatorTier: editingType.creatorTier,
                        allowsChildren: editingType.allowsChildren,
                        requiresParent: editingType.requiresParent,
                    }
                    : EMPTY_FORM
            );
            setError(null);
        }
    }, [isOpen, editingType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (form.requiresParent && form.allowsChildren) {
            setError('Bir tip aynı anda hem üst görev hem alt görev davranışına sahip olamaz.');
            return;
        }

        try {
            if (editingType) await updateType.mutateAsync({ id: editingType.id, data: form });
            else await createType.mutateAsync(form);
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Kaydedilemedi.');
        }
    };

    return (
        <Modal title={editingType ? 'Issue Type Düzenle' : 'Yeni Issue Type'} isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    <input
                        type="text"
                        placeholder="İkon"
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        maxLength={4}
                        className="border rounded px-2 py-2 text-sm text-center"
                    />
                    <input
                        type="text"
                        placeholder="Adı"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="col-span-2 border rounded px-3 py-2 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Renk</label>
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-8 border rounded" />
                </div>

                <textarea
                    placeholder="Açıklama (opsiyonel)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full border rounded px-3 py-2 text-sm"
                />

                <select value={form.creatorTier} onChange={(e) => setForm({ ...form, creatorTier: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value={0}>Kim oluşturabilir: Herkes</option>
                    <option value={1}>Kim oluşturabilir: Developer ve üstü</option>
                    <option value={2}>Kim oluşturabilir: Yalnızca PM/Admin</option>
                </select>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.allowsChildren}
                        onChange={(e) => setForm({ ...form, allowsChildren: e.target.checked, requiresParent: e.target.checked ? false : form.requiresParent })}
                    />
                    Üst görev olabilir (Epic gibi)
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.requiresParent}
                        onChange={(e) => setForm({ ...form, requiresParent: e.target.checked, allowsChildren: e.target.checked ? false : form.allowsChildren })}
                    />
                    Mutlaka bir üst göreve bağlı olmalı (Sub-task gibi)
                </label>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={createType.isPending || updateType.isPending}
                    className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {editingType ? 'Kaydet' : 'Oluştur'}
                </button>
            </form>
        </Modal>
    );
}