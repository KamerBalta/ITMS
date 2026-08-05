import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectDetail } from '../../hooks/useProjects';
import { useIssueTypes } from '../../hooks/useIssueTypes';
import { useProjectIssueTypes, useAssignIssueType, useRemoveIssueType, useReorderProjectIssueTypes } from '../../hooks/useProjectIssueTypes';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

export function IssueTypesManagementPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.roles.includes('System Admin') ?? false;

    const { data: project } = useProjectDetail(projectId ?? null);
    const canManage = isAdmin || (user?.roles.includes('Project Manager') && project?.ownerName === user?.email);

    const { data: assigned, isLoading } = useProjectIssueTypes(projectId ?? null);
    const { data: catalog } = useIssueTypes(true); // yalnizca aktif global tipler secilebilir
    const assign = useAssignIssueType(projectId!);
    const remove = useRemoveIssueType(projectId!);
    const reorder = useReorderProjectIssueTypes(projectId!);

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
        if (!confirm(`"${name}" tipini bu projeden kaldırmak istediğinize emin misiniz?`)) return;
        try {
            await remove.mutateAsync(issueTypeId);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Kaldırılamadı.');
        }
    };

    return (
        <div className="max-w-2xl space-y-4">
            <Link to={`/projects/${projectId}`} className="text-sm text-indigo-600 hover:underline">
                ← Proje Detayına Dön
            </Link>

            <div>
                <h1 className="text-2xl font-bold">Issue Types</h1>
                <p className="text-sm text-gray-400">Bu projede kullanılacak issue type'lar — global katalogdan seçilir.</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {isLoading ? (
                <p className="text-gray-500">Yükleniyor...</p>
            ) : (
                <div className="bg-white border rounded-lg divide-y">
                    {sorted.map((type, index) => (
                        <div key={type.issueTypeId} className={`p-4 flex items-center gap-3 ${!type.isActive ? 'opacity-50' : ''}`}>
                            {canManage && (
                                <div className="flex flex-col shrink-0">
                                    <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none">
                                        ▲
                                    </button>
                                    <button onClick={() => handleMove(index, 1)} disabled={index === sorted.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none">
                                        ▼
                                    </button>
                                </div>
                            )}
                            <span className="text-xl shrink-0">{type.icon || '📄'}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{type.name}</span>
                                    {type.isSystemDefault && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Sistem</span>}
                                    {!type.isActive && <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">Global olarak pasif</span>}
                                </div>
                                {type.description && <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>}
                            </div>
                            {canManage && !type.isSystemDefault && (
                                <button onClick={() => handleRemove(type.issueTypeId, type.name)} className="text-xs text-red-500 hover:underline shrink-0">
                                    Kaldır
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {canManage && (
                <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Katalogdan Ekle</p>
                    {availableToAdd.length === 0 ? (
                        <p className="text-sm text-gray-400">Eklenebilecek başka bir global tip yok.</p>
                    ) : (
                        <div className="flex gap-2">
                            <select value={selectedToAdd} onChange={(e) => setSelectedToAdd(e.target.value)} className="flex-1 border rounded px-3 py-2 text-sm">
                                <option value="">Tip seçin...</option>
                                {availableToAdd.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.icon} {t.name}
                                    </option>
                                ))}
                            </select>
                            <button onClick={handleAssign} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                                Ekle
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}