import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    GitBranch,
    Check,
    Copy,
    AlertTriangle,
    Trash2,
    Code,
    Terminal,
    KeyRound,
} from 'lucide-react';
import { useCanManageProject } from '../../hooks/useCanManageProject';
import {
    useGitIntegration,
    useSetupGitIntegration,
    useDeleteGitIntegration,
    useAvailableCommitCommands,
} from '../../hooks/useGitIntegration';
import { useWorkflowStatuses } from '../../hooks/useWorkflow';
import type { GitIntegrationSetupResult } from '../../types/gitIntegration';

export function GitIntegrationPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const canManage = useCanManageProject(projectId ?? null);
    const { data: integration, isLoading } = useGitIntegration(projectId ?? null);
    const { data: statuses } = useWorkflowStatuses(projectId ?? null);
    const { data: availableCommands } = useAvailableCommitCommands(projectId ?? null);
    const setup = useSetupGitIntegration(projectId!);
    const deleteIntegration = useDeleteGitIntegration(projectId!);

    const [provider, setProvider] = useState('GitHub');
    const [repoUrl, setRepoUrl] = useState('');
    const [azureOrgUrl, setAzureOrgUrl] = useState('');
    const [azureProjectName, setAzureProjectName] = useState('');
    const [azurePat, setAzurePat] = useState('');
    const [closeStatusId, setCloseStatusId] = useState('');
    const [setupResult, setSetupResult] = useState<GitIntegrationSetupResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<'url' | 'secret' | null>(null);

    if (!projectId) return null;

    const handleSetup = async () => {
        if (!repoUrl.trim()) return;
        setError(null);
        try {
            const result = await setup.mutateAsync({
                provider,
                repositoryUrl: repoUrl,
                closeTargetStatusId: closeStatusId || undefined,
                azureDevOpsOrgUrl: provider.startsWith('AzureDevOps') ? azureOrgUrl : undefined,
                azureDevOpsProjectName: provider.startsWith('AzureDevOps') ? azureProjectName : undefined,
                azureDevOpsPersonalAccessToken: provider.startsWith('AzureDevOps') ? azurePat : undefined,
            });
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
            <Link
                to={`/projects/${projectId}`}
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
                <ArrowLeft size={16} />
                <span>Proje Detayına Dön</span>
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <GitBranch size={24} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Git Entegrasyonu</span>
                </h1>
                <p className="text-sm text-muted mt-1">
                    Commit mesajlarında <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{ISSUE-KEY}'}</code> referansı,
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded mx-1">#comment</code>,
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded mx-1">#close</code> komutlarını destekler.
                </p>
            </div>

            {!canManage && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Bu sayfayı yalnızca görüntüleyebilirsiniz.</span>
                </div>
            )}

            {isLoading ? (
                <p className="text-muted text-sm">Yükleniyor...</p>
            ) : setupResult ? (
                <div className="surface border border-orange-300 dark:border-orange-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                        <AlertTriangle size={16} className="shrink-0" />
                        <span>
                            ⚠️ Webhook Secret ve (varsa) PAT yalnızca bir kez gösterilir — şimdi kaydedin.
                        </span>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-secondary">Webhook URL</label>
                        <div className="flex gap-2 mt-1">
                            <input
                                readOnly
                                value={setupResult.webhookUrl}
                                className="flex-1 input-base border rounded px-3 py-2 text-xs font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(setupResult.webhookUrl, 'url')}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                            >
                                {copied === 'url' ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copied === 'url' ? 'Kopyalandı' : 'Kopyala'}</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-secondary">Webhook Secret</label>
                        <div className="flex gap-2 mt-1">
                            <input
                                readOnly
                                value={setupResult.webhookSecret}
                                className="flex-1 input-base border rounded px-3 py-2 text-xs font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(setupResult.webhookSecret, 'secret')}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                            >
                                {copied === 'secret' ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copied === 'secret' ? 'Kopyalandı' : 'Kopyala'}</span>
                            </button>
                        </div>
                    </div>

                    {provider.startsWith('AzureDevOps') ? (
                        <div className="text-xs text-muted space-y-1">
                            <p>Azure DevOps'ta üç ayrı Service Hook gerekir (Project Settings → Service Hooks → Create Subscription):</p>
                            <p>1. <strong>TFVC checked in</strong> — Smart Commit komutları için</p>
                            <p>2. <strong>Build completed</strong> — Build durumu için (PAT gerektirir)</p>
                            <p>3. <strong>Release deployment completed</strong> — Deployment takibi için (PAT gerektirir)</p>
                            <p>Her birinde Action olarak "Web Hooks" seçip aynı Webhook URL'i girin.</p>
                        </div>
                    ) : (
                        <div className="text-xs text-muted space-y-1">
                            <p>GitHub'da: Repo → Settings → Webhooks → Add webhook</p>
                            <p>Payload URL alanına yukarıdaki URL'i, Secret alanına yukarıdaki secret'i, Content type olarak "application/json" seçin.</p>
                            <p>
                                "Let me select individual events" seçip şunları işaretleyin: <strong>Pushes</strong>,{' '}
                                <strong>Branch or tag creation</strong>, <strong>Pull requests</strong> — Smart Commit komutları,
                                otomatik branch/PR tetikleyicileri bunlara bağlıdır.
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setSetupResult(null)}
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                        Tamam, kapat
                    </button>
                </div>
            ) : integration ? (
                <div className="surface border rounded-lg p-4 space-y-3">
                    <p className="text-sm text-secondary">
                        <strong>{integration.provider}</strong> — {integration.repositoryUrl}
                    </p>
                    <p className="text-xs text-muted">
                        Webhook URL: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{integration.webhookUrl}</code>
                    </p>
                    {canManage && (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('Git entegrasyonunu kaldırmak istediğinize emin misiniz?')) {
                                    deleteIntegration.mutate();
                                }
                            }}
                            className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        >
                            <Trash2 size={15} />
                            <span>Entegrasyonu Kaldır</span>
                        </button>
                    )}
                </div>
            ) : canManage ? (
                <div className="surface border rounded-lg p-4 space-y-3">
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full input-base border rounded px-3 py-2 text-sm"
                    >
                        <option value="GitHub">GitHub</option>
                        <option value="GitLab">GitLab</option>
                        <option value="AzureDevOpsTFVC">Azure DevOps (TFVC)</option>
                        <option value="AzureDevOpsGit">Azure DevOps (Git)</option>
                    </select>

                    {provider.startsWith('AzureDevOps') && (
                        <>
                            <input
                                type="text"
                                placeholder="https://dev.azure.com/orgadi"
                                value={azureOrgUrl}
                                onChange={(e) => setAzureOrgUrl(e.target.value)}
                                className="w-full input-base border rounded px-3 py-2 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Azure DevOps Proje Adı"
                                value={azureProjectName}
                                onChange={(e) => setAzureProjectName(e.target.value)}
                                className="w-full input-base border rounded px-3 py-2 text-sm"
                            />
                            <div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="Personal Access Token (PAT)"
                                        value={azurePat}
                                        onChange={(e) => setAzurePat(e.target.value)}
                                        className="w-full input-base border rounded px-3 py-2 text-sm pl-9"
                                    />
                                    <KeyRound size={16} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
                                </div>
                                <p className="text-xs text-muted mt-1">
                                    Build/Release durumunu okumak için gerekli. Azure DevOps → User Settings → Personal Access Tokens →{' '}
                                    <strong>Build (Read)</strong> ve <strong>Release (Read)</strong> yetkileriyle bir token oluşturun.
                                    Bu alan bir kez kaydedilir, tekrar görüntülenmez.
                                </p>
                            </div>
                        </>
                    )}

                    <input
                        type="text"
                        placeholder={provider.startsWith('AzureDevOps') ? "$/ProjectName veya repo URL'si" : "https://github.com/org/repo"}
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        className="w-full input-base border rounded px-3 py-2 text-sm"
                    />

                    <select
                        value={closeStatusId}
                        onChange={(e) => setCloseStatusId(e.target.value)}
                        className="w-full input-base border rounded px-3 py-2 text-sm"
                    >
                        <option value="">#close komutu için hedef durum seçin (opsiyonel)</option>
                        {statuses
                            ?.filter((s) => s.category === 'Done')
                            .map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                    </select>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <button
                        type="button"
                        onClick={handleSetup}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm font-medium transition cursor-pointer"
                    >
                        Kur
                    </button>
                </div>
            ) : (
                <p className="text-sm text-muted">Bu proje için henüz Git entegrasyonu kurulmamış.</p>
            )}

            {availableCommands && availableCommands.length > 0 && (
                <div className="surface border rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-secondary flex items-center gap-2">
                        <Terminal size={16} />
                        <span>Bu Projede Kullanılabilir Komutlar</span>
                    </p>
                    <p className="text-xs text-muted">
                        Bu proje için tanımlı durumlara göre otomatik oluşturulmuştur. Bir komutun çalışıp çalışmayacağı, görevin{' '}
                        <strong>mevcut durumundan hedef duruma workflow'da bir geçiş tanımlı olup olmadığına</strong> bağlıdır.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {availableCommands.map((c) => (
                            <span
                                key={c.command}
                                className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-secondary px-2 py-1 rounded"
                                title={`${c.statusName} durumuna geçirir`}
                            >
                                {c.command}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="surface border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-secondary flex items-center gap-2">
                    <Code size={16} />
                    <span>Commit Mesajı Örneği</span>
                </p>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-x-auto text-secondary font-mono">{`git commit -m "ITMS-123 #comment API entegrasyonu tamamlandı ${availableCommands?.[0]?.command ?? '#done'} #time 2h"`}</pre>
                <p className="text-xs text-muted">
                    Komut, yalnızca görevin mevcut durumundan hedef duruma bu projenin workflow'unda tanımlı bir geçiş varsa uygulanır.
                    Geçersiz bir geçiş denenirse görev değişmez, görevde bir uyarı yorumu (⚠️) görünür.
                </p>
            </div>
        </div>
    );
}