import { useState, useEffect } from 'react';
import { useBoards, useCreateBoard } from '../hooks/useBoards';
import { useCanManageProject } from '../hooks/useCanManageProject';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api';

interface BoardSelectorProps {
    projectId: string;
    selectedBoardId: string | null;
    onSelect: (boardId: string) => void;
}

export function BoardSelector({ projectId, selectedBoardId, onSelect }: BoardSelectorProps) {
    const { data: boards, isLoading } = useBoards(projectId);
    const canManage = useCanManageProject(projectId);
    const createBoard = useCreateBoard(projectId);

    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [boardType, setBoardType] = useState<'Scrum' | 'Kanban'>('Kanban');
    const [error, setError] = useState<string | null>(null);

    // İlk yüklemede, henüz bir board seçilmemişse ilkini otomatik seç.
    useEffect(() => {
        if (!isLoading && boards && boards.length > 0 && !selectedBoardId) {
            onSelect(boards[0].id);
        }
    }, [isLoading, boards, selectedBoardId, onSelect]);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setError(null);
        try {
            const result = await createBoard.mutateAsync({ name, boardType });
            onSelect(result.data.id);
            setName('');
            setIsCreating(false);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Board oluşturulamadı.');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <select
                value={selectedBoardId ?? ''}
                onChange={(e) => onSelect(e.target.value)}
                className="input-base border rounded px-3 py-1.5 text-sm"
            >
                {boards?.map((b) => (
                    <option key={b.id} value={b.id}>
                        {b.name} ({b.boardType === 'Scrum' ? 'Scrum' : 'Kanban'})
                    </option>
                ))}
            </select>

            {canManage && (
                <button onClick={() => setIsCreating(true)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    + Board
                </button>
            )}

            {isCreating && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setIsCreating(false)}>
                    <div className="surface border rounded-lg shadow-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-semibold text-primary mb-3">Yeni Board Oluştur</p>
                        <input
                            type="text"
                            placeholder="Board adı"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full input-base border rounded px-3 py-2 text-sm mb-3"
                        />
                        <div className="space-y-2 mb-3">
                            <label className="flex items-center gap-2 text-sm text-secondary">
                                <input type="radio" checked={boardType === 'Scrum'} onChange={() => setBoardType('Scrum')} />
                                <div>
                                    <p className="font-medium">Scrum</p>
                                    <p className="text-xs text-muted">Sprint bazlı planlama, Backlog, Sprint Report</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-secondary">
                                <input type="radio" checked={boardType === 'Kanban'} onChange={() => setBoardType('Kanban')} />
                                <div>
                                    <p className="font-medium">Kanban</p>
                                    <p className="text-xs text-muted">Sürekli iş akışı, Sprint zorunlu değil</p>
                                </div>
                            </label>
                        </div>
                        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">Oluştur</button>
                            <button onClick={() => setIsCreating(false)} className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded text-sm text-secondary">İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}