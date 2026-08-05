import { useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useProjectStore } from '../store/projectStore';

export function ProjectSelector() {
    const { data: projects, isLoading } = useProjects();
    const { selectedProjectId, setSelectedProjectId } = useProjectStore();

    // Kullanıcı değiştiğinde veya liste güncellendiğinde, seçili proje mevcut listede yoksa ilk projeyi seç
    useEffect(() => {
        if (!projects || projects.length === 0) return;

        const exists = projects.some((p) => p.id === selectedProjectId);

        if (!exists) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId, setSelectedProjectId]);

    if (isLoading) return <span className="text-sm text-gray-400">Projeler yükleniyor...</span>;
    if (!projects || projects.length === 0) return <span className="text-sm text-gray-400">Proje bulunamadı</span>;

    return (
        <select
            value={selectedProjectId ?? ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm bg-white"
        >
            {projects.map((p) => (
                <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                </option>
            ))}
        </select>
    );
}