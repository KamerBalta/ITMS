import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIssueTemplates, useCreateIssueTemplate, useDeleteIssueTemplate } from '../../hooks/useIssueTemplates';
import { useProjectIssueTypes } from '../../hooks/useProjectIssueTypes';
import { PRIORITY_LABELS } from '../../types/task';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

export function IssueTemplatesManagementPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: templates, isLoading } = useIssueTemplates(projectId ?? null);
    const { data: issueTypes } = useProjectIssueTypes(projectId ?? null);
    const createTemplate = useCreateIssueTemplate(projectId!);
    const deleteTemplate = useDeleteIssueTemplate(projectId!);

    const [name, setName] = useState('');
    const [issueTypeId, setIssueTypeId] = useState('');
    const [descTemplate, setDescTemplate] = useState('');
    const [priority, setPriority] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!projectId) return null;

    const handleCreate = async () => {
        if (!name.trim() || !issueTypeId) return;
        setError(null);
        try {
            await createTemplate.mutateAsync({
                issueTypeId, name, descriptionTemplate: descTemplate || undefined,
                defaultPriority: priority ? Number(priority) : undefined, isDefault,
            });
            setName(''); setDescTemplate(''); setPriority(''); setIsDefault(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Oluşturulamadı.');
        }
    };

    return (
        <div className="max-w-2xl space-y-4">
            <Link to={`/projects/${projectId}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">← Proje Detayına Dön</Link>

            <div>
                <h1 className="text-2xl font-bold text-primary">Issue Şablonları</h1>
                <p className="text-sm text-muted">
                    Bir Issue Type için varsayılan şablon tanımlarsanız, Create Issue ekranında bu tip seçildiğinde otomatik önerilir.
                </p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : (
                <div className="surface border rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    {templates?.map((t) => (
                        <div key={t.id} className="p-3 flex items-center justify-between text-sm">
                            <div>
                                <p className="font-medium text-primary">{t.name} <span className="text-muted font-normal">— {t.issueTypeName}</span></p>
                                {t.isDefault && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">Varsayılan</span>}
                            </div>
                            <button onClick={() => deleteTemplate.mutate(t.id)} className="text-xs text-red-500 dark:text-red-400 hover:underline">Sil</button>
                        </div>
                    ))}
                    {templates?.length === 0 && <p className="text-sm text-muted p-3">Henüz şablon yok.</p>}
                </div>
            )}

            <div className="surface border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-secondary">Yeni Şablon</p>
                <input type="text" placeholder="Şablon adı (örn. Bug Raporu)" value={name} onChange={(e) => setName(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm" />
                <select value={issueTypeId} onChange={(e) => setIssueTypeId(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm">
                    <option value="">Issue Type seçin...</option>
                    {issueTypes?.map((t) => <option key={t.issueTypeId} value={t.issueTypeId}>{t.name}</option>)}
                </select>
                <textarea
                    placeholder={'Açıklama şablonu (örn:\n## Beklenen Davranış\n\n## Gerçekleşen Davranış\n\n## Adımlar\n1. \n2. )'}
                    value={descTemplate}
                    onChange={(e) => setDescTemplate(e.target.value)}
                    rows={5}
                    className="w-full input-base border rounded px-3 py-2 text-sm font-mono"
                />
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm">
                    <option value="">Varsayılan öncelik yok</option>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-secondary">
                    <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                    Bu Issue Type için varsayılan şablon (otomatik önerilsin)
                </label>
                <button onClick={handleCreate} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">Ekle</button>
            </div>
        </div>
    );
}