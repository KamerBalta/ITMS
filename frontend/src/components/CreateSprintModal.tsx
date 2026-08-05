import { useState } from 'react';
import { Modal } from './Modal';
import { useCreateSprint } from '../hooks/useSprints';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api';

interface CreateSprintModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

// Varsayilan olarak 1 aylik donem oneriyoruz -- Bolum 8.1'deki "1 Sprint = 1 Aylik Donem" kararina uygun
function defaultDates() {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
    };
}

export function CreateSprintModal({ projectId, isOpen, onClose }: CreateSprintModalProps) {
    const createSprint = useCreateSprint(projectId);
    const defaults = defaultDates();

    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await createSprint.mutateAsync({ projectId, name, goal: goal || undefined, startDate, endDate });
            setName('');
            setGoal('');
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Sprint oluşturulamadı.');
        }
    };

    return (
        <Modal title="Yeni Sprint Oluştur" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="Sprint adı (örn. 2026 Ağustos Dönemi)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2 text-sm"
                />
                <textarea
                    placeholder="Sprint hedefi (opsiyonel)"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={2}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-gray-500">Başlangıç</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Bitiş</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={createSprint.isPending}
                    className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {createSprint.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
            </form>
        </Modal>
    );
}