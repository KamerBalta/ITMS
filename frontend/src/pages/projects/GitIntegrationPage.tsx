import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCanManageProject } from '../../hooks/useCanManageProject';
import { useGitIntegration, useSetupGitIntegration, useDeleteGitIntegration } from '../../hooks/useGitIntegration';
import { useWorkflowStatuses } from '../../hooks/useWorkflow';
import type { GitIntegrationSetupResult } from '../../types/gitIntegration';

export function GitIntegrationPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const canManage = useCanManageProject(projectId ?? null);
    const { data: integration, isLoading } = useGitIntegration(projectId ?? null);
    const { data: statuses } = useWorkflowStatuses(projectId ?? null);
    const setup = useSetupGitIntegration(projectId!);
    const deleteIntegration = useDeleteGitIntegration(projectId!);

    const [provider, setProvider] = useState('GitHub');
    const [repoUrl, setRepoUrl] = useState('');
    const [closeStatusId, setCloseStatusId] = useState('');
    const [setupResult, setSetupResult] = useState<GitIntegrationSetupResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<'url' | 'secret' | null>(null);

    if (!projectId) return null;

    const handleSetup = async () => {
        if (!repoUrl.trim()) return;
        setError(null);
        try {
            const result = await setup.mutateAsync({ provider, repositoryUrl: repoUrl, closeTargetStatusId: closeStatusId || undefined });
            setSetupResult(result);
        } catch {
            setError('Kurulum başarısız oldu.');
        }
    };

    const handleCopy = (text: string, which: 'url' | 'secret') => {
        navigator.clipboard.writeText(text);
        setCopied(which);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-2xl space-y-4">
            <Link to={`/projects/${projectId}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">← Proje Detayına Dön</Link>

            <div>
                <h1 className="text-2xl font-bold text-primary">Git Entegrasyonu</h1>
                <p className="text-sm text-muted">
                    Commit mesajlarında <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{ISSUE-KEY}'}</code> referansı,
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded mx-1">#comment</code>,
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded mx-1">#close</code> komutlarını destekler.
                </p>
            </div>

            {!canManage && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded px-3 py-2">
                    Bu sayfayı yalnızca görüntüleyebilirsiniz.
                </p>
            )}

            {isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : setupResult ? (
                <div className="surface border border-orange-300 dark:border-orange-800 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        ⚠️ Bu bilgiler yalnızca bir kez gösterilir — GitHub repo ayarlarınıza şimdi ekleyin.
                    </p>
                    <div>
                        <label className="text-xs text-secondary">Webhook URL</label>
                        <div className="flex gap-2 mt-1">
                            <input readOnly value={setupResult.webhookUrl} className="flex-1 input-base border rounded px-3 py-2 text-xs font-mono" />
                            <button onClick={() => handleCopy(setupResult.webhookUrl, 'url')} className="text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                                {copied === 'url' ? '✓ Kopyalandı' : 'Kopyala'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-secondary">Webhook Secret</label>
                        <div className="flex gap-2 mt-1">
                            <input readOnly value={setupResult.webhookSecret} className="flex-1 input-base border rounded px-3 py-2 text-xs font-mono" />
                            <button onClick={() => handleCopy(setupResult.webhookSecret, 'secret')} className="text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                                {copied === 'secret' ? '✓ Kopyalandı' : 'Kopyala'}
                            </button>
                        </div>
                    </div>
                    <div className="text-xs text-muted space-y-1">
                        <p>GitHub'da: Repo → Settings → Webhooks → Add webhook</p>
                        <p>Payload URL alanına yukarıdaki URL'i, Secret alanına yukarıdaki secret'i, Content type olarak "application/json" seçin, "Just the push event" işaretleyin.</p>
                    </div>
                    <button onClick={() => setSetupResult(null)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Tamam, kapat</button>
                </div>
            ) : integration ? (
                <div className="surface border rounded-lg p-4 space-y-2">
                    <p className="text-sm text-secondary">
                        <strong>{integration.provider}</strong> — {integration.repositoryUrl}
                    </p>
                    <p className="text-xs text-muted">Webhook URL: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{integration.webhookUrl}</code></p>
                    {canManage && (
                        <button
                            onClick={() => { if (confirm('Git entegrasyonunu kaldırmak istediğinize emin misiniz?')) deleteIntegration.mutate(); }}
                            className="text-sm text-red-500 dark:text-red-400 hover:underline"
                        >
                            Entegrasyonu Kaldır
                        </button>
                    )}
                </div>
            ) : canManage ? (
                <div className="surface border rounded-lg p-4 space-y-2">
                    <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm">
                        <option value="GitHub">GitHub</option>
                        <option value="GitLab">GitLab</option>
                    </select>
                    <input type="text" placeholder="https://github.com/org/repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm" />
                    <select value={closeStatusId} onChange={(e) => setCloseStatusId(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm">
                        <option value="">#close komutu için hedef durum seçin (opsiyonel)</option>
                        {statuses?.filter((s) => s.category === 'Done').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <button onClick={handleSetup} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">Kur</button>
                </div>
            ) : (
                <p className="text-sm text-muted">Bu proje için henüz Git entegrasyonu kurulmamış.</p>
            )}

            <div className="surface border rounded-lg p-4">
                <p className="text-sm font-medium text-secondary mb-2">Commit Mesajı Örneği</p>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-x-auto text-secondary">
                    {`git commit -m "ITMS-123 #comment API entegrasyonu tamamlandı #close #time 2h"`}
                </pre>
                <p className="text-xs text-muted mt-2">
                    Bu commit, ITMS-123 görevine yorum ekler, görevi kapatır ve 2 saat çalışma süresi kaydeder.
                </p>
            </div>
        </div>
    );
}