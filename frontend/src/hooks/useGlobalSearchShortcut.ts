import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useGlobalSearchShortcut() {
    const navigate = useNavigate();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                navigate('/search');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [navigate]);
}