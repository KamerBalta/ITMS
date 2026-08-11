import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import {
    useReleases,
    useCreateRelease,
    useUpdateRelease,
    useReleaseTasks,
} from '../../hooks/useReleases';
import { Modal } from '../../components/Modal';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

export function ReleasesPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const user = useAuthStore((state) => state.user);
    const isPM = user?.roles.some((r) => r === 'System Admin' || r === 'Project Manager') ?? false;

    const { data: releases, isLoading } = useReleases(selectedProjectId);
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    if (!selectedProjectId) {
        return <p className="text-secondary">Devam etmek için üstten bir proje seçin.</p>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-primary">Releases</h1>
                    <p className="text-sm text-secondary mt-1">
                        Projenin sürümlerini ve yayın planlarını yönetin.
                    </p>
                </div>

                {isPM && (
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition cursor-pointer"
                    >
                        + Create release
                    </button>
                )}
            </div>

            {/* İçerik */}
            {isLoading ? (
                <p className="text-secondary">Yükleniyor...</p>
            ) : !releases || releases.length === 0 ? (
                <div className="surface border rounded-lg p-8 text-center text-muted text-sm">
                    Henüz bu proje için bir sürüm (release) oluşturulmamış.
                </div>
            ) : (
                <div className="space-y-3">
                    {releases.map((r) => (
                        <div key={r.id} className="surface border rounded-lg p-4 shadow-xs hover:border-gray-300 dark:hover:border-gray-600 transition">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{r.version}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted">
                                        {r.releaseDate ? new Date(r.releaseDate).toLocaleDateString('tr-TR') : 'Tarih belirtilmemiş'}
                                    </span>
                                    {isPM && (
                                        <button
                                            onClick={() => setEditingId(r.id)}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                                        >
                                            Düzenle
                                        </button>
                                    )}
                                </div>
                            </div>
                            {r.description && <p className="text-sm text-secondary mt-1">{r.description}</p>}
                            <ReleaseTasksList releaseId={r.id} />
                        </div>
                    ))}
                </div>
            )}

            {/* Modallar */}
            <CreateReleaseModal
                projectId={selectedProjectId}
                isOpen={isCreateOpen}
                onClose={() => setCreateOpen(false)}
            />

            {editingId && (
                <EditReleaseModal
                    projectId={selectedProjectId}
                    release={releases!.find((r) => r.id === editingId)!}
                    onClose={() => setEditingId(null)}
                />
            )}
        </div>
    );
}

function CreateReleaseModal({
    projectId,
    isOpen,
    onClose,
}: {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const createRelease = useCreateRelease(projectId);
    const [version, setVersion] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await createRelease.mutateAsync({
                version,
                releaseDate: releaseDate || null,
                description: description || undefined,
            });
            setVersion('');
            setReleaseDate('');
            setDescription('');
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Release oluşturulamadı.');
        }
    };

    return (
        <Modal title="Yeni Release Oluştur" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Versiyon</label>
                    <input
                        type="text"
                        placeholder="Örn: v1.0.0"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        required
                        className="w-full input-base border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Yayın Tarihi</label>
                    <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="w-full input-base border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Sürüm Notu</label>
                    <textarea
                        placeholder="Sürüm notu (opsiyonel)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full input-base border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover-surface text-secondary cursor-pointer"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={createRelease.isPending}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                    >
                        {createRelease.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function EditReleaseModal({
    projectId,
    release,
    onClose,
}: {
    projectId: string;
    release: { id: string; releaseDate: string | null; description: string | null };
    onClose: () => void;
}) {
    const updateRelease = useUpdateRelease(projectId);
    const [releaseDate, setReleaseDate] = useState(release.releaseDate?.slice(0, 10) ?? '');
    const [description, setDescription] = useState(release.description ?? '');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await updateRelease.mutateAsync({
                releaseId: release.id,
                data: { releaseDate: releaseDate || null, description: description || undefined },
            });
            onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message ?? 'Güncellenemedi.');
        }
    };

    return (
        <Modal title="Release Düzenle" isOpen onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Yayın Tarihi</label>
                    <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="w-full input-base border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Açıklama / Sürüm Notu</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full input-base border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover-surface text-secondary cursor-pointer"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={updateRelease.isPending}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                    >
                        {updateRelease.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function ReleaseTasksList({ releaseId }: { releaseId: string }) {
    const { data: tasks } = useReleaseTasks(releaseId);
    const [expanded, setExpanded] = useState(false);

    if (!tasks || tasks.length === 0) return null;

    return (
        <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
            <button
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
            >
                {expanded ? 'Gizle' : `${tasks.length} görevi göster`}
            </button>
            {expanded && (
                <ul className="mt-2 space-y-1.5 pl-2 border-l-2 border-indigo-100 dark:border-indigo-900">
                    {tasks.map((t) => (
                        <li key={t.id} className="text-xs text-secondary flex items-center justify-between">
                            <Link to={`/tasks/${t.id}`} className="hover:underline font-medium text-primary">
                                {t.title}
                            </Link>
                            <span className="surface-muted text-secondary px-1.5 py-0.5 rounded text-[10px] font-semibold border border-gray-200 dark:border-gray-700">
                                {t.status}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}