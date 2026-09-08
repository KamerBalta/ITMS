import { useTaskGitCommits } from '../../../hooks/useGitIntegration';

export function GitActivitySection({ taskId, issueKey }: { taskId: string; issueKey: string }) {
    const { data: commits, isLoading } = useTaskGitCommits(taskId);

    const branchName = `${issueKey.toLowerCase()}-` + 'yeni-ozellik'; // #Git: onerilen branch adi -- kullanici sonuna kendi aciklamasini ekleyebilir

    const copyBranchCommand = () => {
        navigator.clipboard.writeText(`git checkout -b ${branchName}`);
    };

    if (isLoading) return null;

    if (!commits || commits.length === 0) {
        return (
            <div className="surface border rounded-lg p-4">
                <h2 className="font-semibold text-primary mb-2">Git Activity</h2>
                <p className="text-sm text-muted mb-2">Bu görevle ilişkili commit henüz yok.</p>
                <button onClick={copyBranchCommand} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    📋 Branch oluşturma komutunu kopyala ({branchName})
                </button>
            </div>
        );
    }

    const isTfvc = commits[0]?.sourceType === 'TFVC';

    return (
        <div className="surface border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-primary">
                    {commits[0]?.sourceType === 'TFVC' ? 'TFVC Activity' : 'Git Activity'} ({commits.length})
                </h2>
                {!isTfvc && (
                    <button onClick={copyBranchCommand} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        📋 Branch komutu
                    </button>
                )}
            </div>
            <ul className="space-y-2">
                {commits.map((c) => (
                    <li key={c.commitHash} className="text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                        <div className="flex items-center justify-between">
                            {c.commitUrl ? (
                                <a href={c.commitUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono text-xs">
                                    {c.sourceType === 'TFVC' ? `C${c.commitHash}` : c.commitHash.slice(0, 7)}
                                </a>
                            ) : (
                                <span className="font-mono text-xs text-muted">
                                    {c.sourceType === 'TFVC' ? `C${c.commitHash}` : c.commitHash.slice(0, 7)}
                                </span>
                            )}
                            <span className="text-xs text-muted">{new Date(c.committedAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-secondary">{c.commitMessage.split('\n')[0]}</p>
                        <p className="text-xs text-muted">
                            {c.authorName}
                            {c.branchName && ` · ${c.branchName}`}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
}