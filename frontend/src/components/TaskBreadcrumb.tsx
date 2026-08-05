import { Link } from 'react-router-dom';

interface TaskBreadcrumbProps {
    projectId: string;
    projectKey: string;
    issueTypeIcon: string | null;
    issueKey: string;
}

export function TaskBreadcrumb({ projectId, projectKey, issueTypeIcon, issueKey }: TaskBreadcrumbProps) {
    return (
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link to="/projects" className="hover:text-indigo-600 hover:underline">
                Projects
            </Link>
            <span className="text-gray-300">›</span>
            <Link to={`/projects/${projectId}`} className="hover:text-indigo-600 hover:underline">
                {projectKey}
            </Link>
            <span className="text-gray-300">›</span>
            <span className="text-gray-700 font-medium flex items-center gap-1">
                {issueTypeIcon && <span>{issueTypeIcon}</span>}
                {issueKey}
            </span>
        </nav>
    );
}