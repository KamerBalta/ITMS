import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCustomFields, useCreateCustomField, useDeleteCustomField } from '../../hooks/useCustomFields';
import { useCanManageProject } from '../../hooks/useCanManageProject';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const TYPE_LABELS: Record<string, string> = {
    text: 'Metin',
    number: 'Sayı',
    select: 'Seçim Listesi',
    user: 'Kullanıcı',
};

const TYPE_ICONS: Record<string, string> = {
    text: 'Aa',
    number: '#',
    select: '☷',
    user: '👤',
};

export function CustomFieldsManagementPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const canManage = useCanManageProject(projectId ?? null);

    const { data: fields, isLoading, isError } = useCustomFields(projectId ?? null);
    const createField = useCreateCustomField(projectId!);
    const deleteField = useDeleteCustomField(projectId!);

    const [name, setName] = useState('');
    const [fieldType, setFieldType] = useState('text');
    const [optionsText, setOptionsText] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!projectId) return null;

    const parseOptions = (optionsJson?: string | null): string[] => {
        if (!optionsJson) return [];
        try {
            return JSON.parse(optionsJson);
        } catch {
            return [];
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) return;

        if (fieldType === 'select' && !optionsText.trim()) {
            setError('Seçim Listesi tipi için en az bir seçenek girmelisiniz.');
            return;
        }

        setError(null);

        const optionsJson =
            fieldType === 'select'
                ? JSON.stringify(
                    optionsText
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                )
                : undefined;

        try {
            await createField.mutateAsync({
                name: name.trim(),
                fieldType,
                optionsJson,
                isRequired,
            });
            setName('');
            setOptionsText('');
            setIsRequired(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Oluşturulamadı.');
        }
    };

    return (
        <div className="max-w-4xl space-y-6 p-6">
            <div>
                <Link
                    to={`/projects/${projectId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition"
                >
                    ← Proje / Proje Ayarları
                </Link>

                <div className="mt-4">
                    <h1 className="text-xl font-semibold text-primary">Özel Alanlar</h1>
                    <p className="mt-1 text-sm text-secondary">
                        Bu projede kullanılacak özel alanları yönetin.
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="font-semibold opacity-70 hover:opacity-100 cursor-pointer"
                    >
                        ×
                    </button>
                </div>
            )}

            {isError ? (
                <div className="surface border border-red-200 dark:border-red-900/60 rounded-lg p-8 text-center bg-red-50/50 dark:bg-red-950/20">
                    <p className="text-sm font-medium text-red-500">
                        Bu sayfayı görüntüleme yetkiniz yok veya bir hata oluştu.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="surface border rounded-lg p-8 text-center">
                    <p className="text-sm text-secondary">Yükleniyor...</p>
                </div>
            ) : (
                <div className="surface overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 bg-surface-muted px-5 py-4 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-primary">Özel Alanlar</h2>
                        <p className="mt-1 text-xs text-secondary">
                            Görevlerde kullanılacak proje özel alanları.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {fields?.map((f) => {
                            const options = parseOptions(f.optionsJson);

                            return (
                                <div
                                    key={f.id}
                                    className="group flex items-start gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-secondary dark:bg-gray-800">
                                        {TYPE_ICONS[f.fieldType] ?? 'Aa'}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-primary">
                                                {f.name}
                                            </span>

                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-secondary dark:bg-gray-800">
                                                {TYPE_LABELS[f.fieldType] ?? f.fieldType}
                                            </span>

                                            {f.isRequired && (
                                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500 dark:bg-red-950/40 dark:text-red-400">
                                                    Zorunlu
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 text-xs text-muted">
                                            {f.isRequired
                                                ? 'Bu alan doldurulmadan görev kaydedilemez.'
                                                : 'İsteğe bağlı özel alan.'}
                                        </p>

                                        {f.fieldType === 'select' && options.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                {options.map((opt) => (
                                                    <span
                                                        key={opt}
                                                        className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-secondary dark:border-gray-700 dark:bg-gray-800"
                                                    >
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {canManage && (
                                        <button
                                            type="button"
                                            onClick={() => deleteField.mutate(f.id)}
                                            disabled={deleteField.isPending}
                                            className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                                        >
                                            {deleteField.isPending ? 'Siliniyor...' : 'Sil'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {fields?.length === 0 && (
                            <div className="px-5 py-12 text-center">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm dark:bg-gray-800">
                                    Aa
                                </div>
                                <p className="mt-3 text-sm font-medium text-primary">
                                    Henüz özel alan yok
                                </p>
                                <p className="mt-1 text-xs text-secondary">
                                    {canManage
                                        ? 'Aşağıdaki formu kullanarak ilk özel alanınızı oluşturabilirsiniz.'
                                        : 'Bu projede henüz tanımlanmış bir özel alan bulunmuyor.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!isError && canManage && (
                <div className="surface overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 bg-surface-muted px-5 py-4 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-primary">Yeni Özel Alan</h2>
                        <p className="mt-1 text-xs text-secondary">
                            Görevlerde kullanılacak yeni bir alan oluşturun.
                        </p>
                    </div>

                    <div className="space-y-5 p-5">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">
                                Alan adı
                            </label>
                            <input
                                type="text"
                                placeholder="Örn. Müşteri Adı"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-base w-full rounded-lg border px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">
                                Alan tipi
                            </label>
                            <select
                                value={fieldType}
                                onChange={(e) => setFieldType(e.target.value)}
                                className="input-base w-full cursor-pointer rounded-lg border px-3 py-2.5 text-sm"
                            >
                                <option value="text">Aa — Metin</option>
                                <option value="number"># — Sayı</option>
                                <option value="select">☷ — Seçim Listesi</option>
                                <option value="user">👤 — Kullanıcı</option>
                            </select>
                        </div>

                        {fieldType === 'select' && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-secondary">
                                    Seçenekler
                                </label>
                                <input
                                    type="text"
                                    placeholder="Virgülle ayırın (örn. Düşük, Orta, Yüksek)"
                                    value={optionsText}
                                    onChange={(e) => setOptionsText(e.target.value)}
                                    className="input-base w-full rounded-lg border px-3 py-2.5 text-sm"
                                />
                                <p className="mt-1 text-xs text-muted">
                                    Seçenekleri aralarına virgül koyarak yazabilirsiniz.
                                </p>
                            </div>
                        )}

                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                            <input
                                type="checkbox"
                                checked={isRequired}
                                onChange={(e) => setIsRequired(e.target.checked)}
                                className="mt-0.5 rounded"
                            />
                            <div>
                                <p className="text-sm font-medium text-primary">Zorunlu alan</p>
                                <p className="mt-0.5 text-xs text-secondary">
                                    Bu alan doldurulmadan görev oluşturulmasına veya güncellenmesine izin verilmez.
                                </p>
                            </div>
                        </label>

                        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={!name.trim() || createField.isPending}
                                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                                {createField.isPending ? 'Oluşturuluyor...' : 'Alan Oluştur'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}