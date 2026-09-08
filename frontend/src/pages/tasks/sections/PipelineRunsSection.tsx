import { useTaskPipelineRuns } from '../../../hooks/useGitIntegration';

const RESULT_COLORS: Record<string, string> = {
    Succeeded: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    Failed: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
    InProgress: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    Cancelled: 'bg-gray-100 dark:bg-gray-700 text-secondary',
};

export function PipelineRunsSection({ taskId }: { taskId: string }) {
    const { data: runs, isLoading } = useTaskPipelineRuns(taskId);
    if (isLoading || !runs || runs.length === 0) return null;

    return (
        <div className="surface border rounded-lg p-4">
            <h2 className="font-semibold text-primary mb-2">Build & Deployment</h2>
            <ul className="space-y-2">
                {runs.map((r, i) => (
                    <li key={i} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                        <div>
                            {r.pipelineUrl ? (
                                <a href={r.pipelineUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{r.pipelineName}</a>
                            ) : (
                                <span className="text-secondary">{r.pipelineName}</span>
                            )}
                            {r.environment && <p className="text-xs text-muted">{r.environment}{r.version && ` · v${r.version}`}</p>}
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${RESULT_COLORS[r.result] ?? ''}`}>{r.result}</span>
                            <p className="text-[10px] text-muted mt-0.5">{new Date(r.runAt).toLocaleString('tr-TR')}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}