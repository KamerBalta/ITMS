import { Link } from 'react-router-dom';

interface ErrorStateProps {
    message: string;
    backLink?: { to: string; label: string };
}

export function ErrorState({ message, backLink }: ErrorStateProps) {
    return (
        <div className="text-center py-16">
            <p className="text-muted">{message}</p>
            {backLink && (
                <Link to={backLink.to} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
                    ← {backLink.label}
                </Link>
            )}
        </div>
    );
}