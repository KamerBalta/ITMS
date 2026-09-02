import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useComponents, useCreateComponent, useDeleteComponent } from '../../hooks/useComponents';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useCanManageProject } from '../../hooks/useCanManageProject';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

export function ComponentsManagementPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const canManage = useCanManageProject(projectId ?? null);

    const { data: components, isLoading, isError } = useComponents(projectId ?? null);
    const { data: members } = useProjectMembers(projectId ?? null);
    const createComponent = useCreateComponent(projectId!);
    const deleteComponent = useDeleteComponent(projectId!);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [leadUserId, setLeadUserId] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!projectId) return null;

    const handleCreate = async () => {
        if (!name.trim()) return;
        setError(null);
        try {
            await createComponent.mutateAsync({
                name: name.trim(),
                description: description.trim() || undefined,
                leadUserId: leadUserId || null,
            });
            setName('');
            setDescription('');
            setLeadUserId('');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Oluşturulamadı.');
        }
    };

    const handleDelete = async (id: string) => {
        setError(null);
        try {
            await deleteComponent.mutateAsync(id);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Silinemedi.');
        }
    };

    return (
        <div className="max-w-2xl space-y-4">
            <Link
                to={`/projects/${projectId}`}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
                ← Proje Detayına Dön
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-primary">Component'ler</h1>
                <p className="text-sm text-muted mt-0.5">
                    Label'dan farkı: her component'in bir sorumlusu (lead) olur, görev oluştururken otomatik atanan olarak önerilir.
                </p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {isError ? (
                <div className="surface border border-red-200 dark:border-red-900/60 rounded-lg p-6 text-center bg-red-50/50 dark:bg-red-950/20">
                    <p className="text-sm font-medium text-red-500">
                        Bu sayfayı görüntüleme yetkiniz yok veya bir hata oluştu.
                    </p>
                </div>
            ) : isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : (
                <div className="surface border rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    {components?.map((c) => (
                        <div key={c.id} className="p-3 flex items-center justify-between text-sm">
                            <div>
                                <p className="font-medium text-primary">{c.name}</p>
                                {c.description && <p className="text-xs text-muted">{c.description}</p>}
                                <p className="text-xs text-muted">
                                    Sorumlu: {c.leadUserName ?? 'Atanmamış'} · {c.taskCount} görev
                                </p>
                            </div>
                            {canManage && (
                                <button
                                    type="button"
                                    onClick={() => handleDelete(c.id)}
                                    disabled={deleteComponent.isPending}
                                    className="text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-50 cursor-pointer"
                                >
                                    Sil
                                </button>
                            )}
                        </div>
                    ))}
                    {components?.length === 0 && (
                        <p className="text-sm text-muted p-3">Henüz component yok.</p>
                    )}
                </div>
            )}

            {!isError && canManage && (
                <div className="surface border rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-secondary">Yeni Component Ekle</p>
                    <input
                        type="text"
                        placeholder="Component adı (örn. API)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full input-base border rounded px-3 py-2 text-sm"
                    />
                    <textarea
                        placeholder="Açıklama (opsiyonel)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full input-base border rounded px-3 py-2 text-sm"
                    />
                    <select
                        value={leadUserId}
                        onChange={(e) => setLeadUserId(e.target.value)}
                        className="w-full input-base border rounded px-3 py-2 text-sm cursor-pointer"
                    >
                        <option value="">Sorumlu (lead) seçin (opsiyonel)</option>
                        {members?.map((m) => (
                            <option key={m.userId} value={m.userId}>
                                {m.userName}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={createComponent.isPending || !name.trim()}
                        className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 font-medium transition cursor-pointer"
                    >
                        {createComponent.isPending ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                </div>
            )}
        </div>
    );
}