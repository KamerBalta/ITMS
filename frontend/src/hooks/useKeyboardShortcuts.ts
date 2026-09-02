import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutHandlers {
    onCreateTask: () => void;
    onShowHelp: () => void;
}

export function useKeyboardShortcuts({ onCreateTask, onShowHelp }: ShortcutHandlers) {
    const navigate = useNavigate();
    const pendingG = useRef(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
            if (isTyping) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                navigate('/search');
                return;
            }

            if (e.shiftKey && e.key === '?') {
                e.preventDefault();
                onShowHelp();
                return;
            }

            if (pendingG.current) {
                pendingG.current = false;
                if (e.key === 'b') navigate('/board');
                else if (e.key === 'p') navigate('/projects');
                else if (e.key === 'l') navigate('/backlog');
                else if (e.key === 'i') navigate('/issues');
                return;
            }

            if (e.key === 'g') {
                pendingG.current = true;
                setTimeout(() => (pendingG.current = false), 1000); // 1sn icinde ikinci tus gelmezse iptal
                return;
            }

            if (e.key === 'c') {
                e.preventDefault();
                onCreateTask();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [navigate, onCreateTask, onShowHelp]);
}