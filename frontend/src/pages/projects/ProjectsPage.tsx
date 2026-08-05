import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjects, useCreateProject } from '../../hooks/useProjects';
import { useTeams } from '../../hooks/useTeams';
import { Modal } from '../../components/Modal';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const STATUS_STYLES: Record<string, string> = {
    Active: 'bg-green-100 text-green-700 border-green-200',
    Archived: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function ProjectsPage() {
    const user = useAuthStore((state) => state.user);
    const canCreate = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;
    const { data: projects, isLoading } = useProjects();
    const [isCreateOpen, setCreateOpen] = useState(false);

    return (
        <div className="space-y-6 px-2 sm:px-0">
            {/* Header (Mobilde alt alta, masada yan yana) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projeler</h1>
                    <p className="text-sm text-gray-500 mt-1">Erişebildiğiniz projeleri görüntüleyin ve yönetin.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition w-full sm:w-auto shrink-0 shadow-sm"
                    >
                        + Yeni Proje
                    </button>
                )}
            </div>

            {isLoading ? (
                <p className="text-gray-500 text-sm">Yükleniyor...</p>
            ) : !projects || projects.length === 0 ? (
                <div className="bg-white border rounded-xl p-8 text-center text-gray-400 text-sm">
                    Erişebildiğiniz bir proje bulunamadı.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((p) => (
                        <Link
                            key={p.id}
                            to={`/projects/${p.id}`}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200 block group"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition truncate">{p.name}</p>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border shrink-0 ${STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {p.status}
                                </span>
                            </div>
                            <p className="text-xs font-mono text-gray-400 mt-1">{p.key}</p>
                            {p.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.description}</p>}
                            <div className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="truncate">Sorumlu: <strong className="text-gray-600">{p.ownerName}</strong></span>
                                <span className="shrink-0">{p.teams.length} takım</span>
                            </div>
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
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Proje Adı</label>
                    <input
                        type="text"
                        placeholder="Örn: Müşteri Portalı"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Proje Anahtarı (Key)</label>
                    <input
                        type="text"
                        placeholder="Örn: ITMS"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        required
                        maxLength={10}
                        className="w-full border rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Açıklama (Opsiyonel)</label>
                    <textarea
                        placeholder="Proje hedefleri hakkında kısa bilgi..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Başlangıç Tarihi</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 bg-white"
                    />
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Takım(lar) Seçimi</p>
                    {!teams || teams.length === 0 ? (
                        <p className="text-xs text-gray-400">Henüz takım yok, önce Takımlar sayfasından oluşturun.</p>
                    ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-300 rounded-lg p-2.5 bg-gray-50">
                            {teams.map((t) => (
                                <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none hover:bg-white p-1 rounded transition">
                                    <input
                                        type="checkbox"
                                        checked={selectedTeamIds.includes(t.id)}
                                        onChange={() => toggleTeam(t.id)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {t.name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

                <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={createProject.isPending}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                        {createProject.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}