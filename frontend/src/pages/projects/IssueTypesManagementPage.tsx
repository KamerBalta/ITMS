import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useIssueTypes } from '../../hooks/useIssueTypes';
import {
    useProjectIssueTypes,
    useAssignIssueType,
    useRemoveIssueType,
    useReorderProjectIssueTypes
} from '../../hooks/useProjectIssueTypes';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import {
    ChevronUp,
    ChevronDown,
    GripVertical,
} from 'lucide-react';

export function IssueTypesManagementPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.roles.includes('System Admin') ?? false;
    const isProjectManager = user?.roles.includes('Project Manager') ?? false;
    const canManage = isAdmin || isProjectManager;

    const { data: assigned, isLoading } = useProjectIssueTypes(projectId ?? null);
    const { data: catalog } = useIssueTypes(true); // Yalnızca aktif global tipler seçilebilir
    const assign = useAssignIssueType(projectId!);
    const remove = useRemoveIssueType(projectId!);
    const reorder = useReorderProjectIssueTypes(projectId!);

    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

    const [selectedToAdd, setSelectedToAdd] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!projectId) return null;

    const sorted = [...(assigned ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const availableToAdd = (catalog ?? []).filter((c) => !sorted.some((s) => s.issueTypeId === c.id));

    const handleMove = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= sorted.length) return;
        const newOrder = [...sorted];
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
        reorder.mutate(newOrder.map((t) => t.issueTypeId));
    };

    const handleAssign = async () => {
        if (!selectedToAdd) return;
        setError(null);
        try {
            await assign.mutateAsync(selectedToAdd);
            setSelectedToAdd('');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Eklenemedi.');
        }
    };

    const handleRemove = async (issueTypeId: string, name: string) => {
        setError(null);
        const ok = await confirm(
            'Issue Type Kaldır',
            `"${name}" tipini bu projeden kaldırmak istediğinize emin misiniz?`,
            true
        );
        if (!ok) return;

        try {
            await remove.mutateAsync(issueTypeId);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Kaldırılamadı.');
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
                    <h1 className="text-xl font-semibold text-primary">
                        Issue Types
                    </h1>

                    <p className="mt-1 text-sm text-secondary">
                        Bu projede kullanılabilecek issue type'ları yönetin.
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="shrink-0 font-semibold opacity-70 hover:opacity-100 cursor-pointer"
                    >
                        ×
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="surface border rounded-lg p-8 text-center">
                    <p className="text-sm text-secondary">Yükleniyor...</p>
                </div>
            ) : (
                <div className="surface overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 bg-surface-muted px-5 py-4 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-primary">
                            Issue Types
                        </h2>

                        <p className="mt-1 text-xs text-secondary">
                            Issue type'ların sırasını değiştirerek oluşturma ekranındaki görünümünü belirleyebilirsiniz.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sorted.map((type, index) => (
                            <div
                                key={type.issueTypeId}
                                className={`
                                    group flex items-center gap-4 px-5 py-4
                                    transition hover:bg-gray-50
                                    dark:hover:bg-gray-900/50
                                    ${!type.isActive ? 'opacity-60' : ''}
                                `}
                            >
                                {canManage ? (
                                    <div className="flex shrink-0 items-center gap-1">
                                        <GripVertical
                                            size={16}
                                            className="text-gray-300 dark:text-gray-600"
                                        />

                                        <div className="flex flex-col">
                                            <button
                                                type="button"
                                                onClick={() => handleMove(index, -1)}
                                                disabled={index === 0 || reorder.isPending}
                                                className="flex h-4 items-center justify-center text-muted hover:text-primary disabled:opacity-20 cursor-pointer"
                                            >
                                                <ChevronUp size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleMove(index, 1)}
                                                disabled={
                                                    index === sorted.length - 1 ||
                                                    reorder.isPending
                                                }
                                                className="flex h-4 items-center justify-center text-muted hover:text-primary disabled:opacity-20 cursor-pointer"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-8 shrink-0" />
                                )}

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
                                    {type.icon || '📄'}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-primary">
                                            {type.name}
                                        </span>

                                        {type.isSystemDefault && (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-secondary dark:bg-gray-800">
                                                Sistem
                                            </span>
                                        )}

                                        {!type.isActive && (
                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500 dark:bg-red-950/50 dark:text-red-400">
                                                Global olarak pasif
                                            </span>
                                        )}
                                    </div>

                                    {type.description && (
                                        <p className="mt-1 text-xs leading-5 text-secondary">
                                            {type.description}
                                        </p>
                                    )}
                                </div>

                                {canManage && !type.isSystemDefault && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemove(
                                                type.issueTypeId,
                                                type.name
                                            )
                                        }
                                        disabled={remove.isPending}
                                        className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                                    >
                                        Kaldır
                                    </button>
                                )}
                            </div>
                        ))}

                        {sorted.length === 0 && (
                            <div className="px-5 py-12 text-center">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    📋
                                </div>

                                <p className="mt-3 text-sm font-medium text-primary">
                                    Bu projede henüz Issue Type yok
                                </p>

                                <p className="mt-1 text-xs text-secondary">
                                    Aşağıdaki katalogdan bu projede kullanılacak Issue Type'ları ekleyebilirsiniz.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {canManage && (
                <div className="surface overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 bg-surface-muted px-5 py-4 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-primary">
                            Issue Type Ekle
                        </h2>

                        <p className="mt-1 text-xs text-secondary">
                            Global Issue Type kataloğundan bu projede kullanılacak tipleri seçin.
                        </p>
                    </div>

                    <div className="p-5">
                        {availableToAdd.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center dark:border-gray-700">
                                <p className="text-sm font-medium text-primary">
                                    Eklenebilecek Issue Type yok
                                </p>

                                <p className="mt-1 text-xs text-secondary">
                                    Global katalogdaki tüm aktif tipler bu projeye zaten eklenmiş.
                                </p>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <select
                                    value={selectedToAdd}
                                    onChange={(e) =>
                                        setSelectedToAdd(e.target.value)
                                    }
                                    className="input-base min-w-0 flex-1 cursor-pointer rounded-lg border px-3 py-2.5 text-sm"
                                >
                                    <option value="">
                                        Issue Type seçin...
                                    </option>

                                    {availableToAdd.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.icon || '📄'} {t.name}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    onClick={handleAssign}
                                    disabled={
                                        !selectedToAdd ||
                                        assign.isPending
                                    }
                                    className="shrink-0 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                >
                                    {assign.isPending
                                        ? 'Ekleniyor...'
                                        : 'Ekle'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                danger={confirmState.danger}
                confirmLabel="Kaldır"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}