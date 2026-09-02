import { useState, useCallback } from 'react';

interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    danger: boolean;
    resolve: ((value: boolean) => void) | null;
}

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({ isOpen: false, title: '', message: '', danger: false, resolve: null });

    const confirm = useCallback((title: string, message: string, danger = false): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ isOpen: true, title, message, danger, resolve });
        });
    }, []);

    const handleConfirm = () => {
        state.resolve?.(true);
        setState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        state.resolve?.(false);
        setState((prev) => ({ ...prev, isOpen: false }));
    };

    return { confirmState: state, confirm, handleConfirm, handleCancel };
}