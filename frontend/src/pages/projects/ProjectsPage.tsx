import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjects, useCreateProject } from '../../hooks/useProjects';
import { useTeams } from '../../hooks/useTeams';
import { Modal } from '../../components/Modal';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const STATUS_STYLES: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Archived: 'bg-gray-100 text-gray-500',
};

export function ProjectsPage() {
    const user = useAuthStore((state) => state.user);
    const canCreate = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const { data: projects, isLoading } = useProjects();
    const [isCreateOpen, setCreateOpen] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Projeler</h1>
                {canCreate && (
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                    >
                        + Yeni Proje
                    </button>
                )}
            </div>

            {isLoading ? (
                <p className="text-gray-500">Yükleniyor...</p>
            ) : !projects || projects.length === 0 ? (
                <p className="text-gray-500">Erişebildiğiniz bir proje bulunamadı.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((p) => (
                        <Link
                            key={p.id}
                            to={`/projects/${p.id}`}
                            className="bg-white border rounded-lg p-4 hover:shadow block"
                        >
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{p.name}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? 'bg-gray-100'}`}>
                                    {p.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{p.key}</p>
                            {p.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>}
                            <p className="text-xs text-gray-400 mt-3">
                                Sorumlu: {p.ownerName} · {p.teams.length} takım
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            <CreateProjectModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
        </div>
    );
}

function CreateProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { data: teams } = useTeams();
    const createProject = useCreateProject();

    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [error, setError] = useState<string | null>(null);

    const toggleTeam = (teamId: string) => {
        setSelectedTeamIds((prev) =>
            prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (selectedTeamIds.length === 0) {
            setError('En az bir takım seçmelisiniz.');
            return;
        }

        try {
            await createProject.mutateAsync({
                name,
                key: key.toUpperCase(),
                description: description || undefined,
                teamIds: selectedTeamIds,
                startDate: startDate || null,
            });
            setName('');
            setKey('');
            setDescription('');
            setSelectedTeamIds([]);
            setStartDate('');
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Proje oluşturulamadı.');
        }
    };

    return (
        <Modal title="Yeni Proje Oluştur" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="Proje adı"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2 text-sm"
                />
                <input
                    type="text"
                    placeholder="Proje anahtarı (örn. ITMS)"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    required
                    maxLength={10}
                    className="w-full border rounded px-3 py-2 text-sm uppercase"
                />
                <textarea
                    placeholder="Açıklama (opsiyonel)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                />

                <div>
                    <p className="text-sm font-medium mb-2">Takım(lar) — kendi üyesi olduğunuz takımlardan seçin</p>
                    {!teams || teams.length === 0 ? (
                        <p className="text-sm text-gray-400">Henüz takım yok, önce Takımlar sayfasından oluşturun.</p>
                    ) : (
                        <div className="space-y-1 max-h-32 overflow-auto border rounded p-2">
                            {teams.map((t) => (
                                <label key={t.id} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedTeamIds.includes(t.id)}
                                        onChange={() => toggleTeam(t.id)}
                                    />
                                    {t.name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={createProject.isPending}
                    className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {createProject.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
            </form>
        </Modal>
    );
}