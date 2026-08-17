import { useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useProjectStore } from '../store/projectStore';
import { ChevronDown } from 'lucide-react';

export function ProjectSelector() {
    const { data: projects, isLoading } = useProjects();
    const {
        selectedProjectId,
        setSelectedProjectId,
    } = useProjectStore();

    useEffect(() => {
        if (!projects || projects.length === 0) return;

        const exists = projects.some(
            (p) => p.id === selectedProjectId
        );

        if (!exists) {
            setSelectedProjectId(projects[0].id);
        }
    }, [
        projects,
        selectedProjectId,
        setSelectedProjectId,
    ]);

    if (isLoading) {
        return (
            <div className="
                flex
                items-center
                h-9
                px-3
                text-sm
                text-muted
            ">
                Projeler yükleniyor...
            </div>
        );
    }

    if (!projects || projects.length === 0) {
        return (
            <div className="
                flex
                items-center
                h-9
                px-3
                text-sm
                text-muted
            ">
                Proje bulunamadı
            </div>
        );
    }

    return (
        <div className="relative">
            <select
                value={selectedProjectId ?? ''}
                onChange={(e) =>
                    setSelectedProjectId(e.target.value)
                }
                aria-label="Proje seç"
                className="
                    appearance-none
                    h-9
                    min-w-[180px]
                    max-w-[240px]

                    pl-3
                    pr-9

                    rounded-md

                    border
                    border-transparent

                    bg-transparent
                    dark:bg-transparent

                    text-sm
                    font-medium

                    text-primary

                    cursor-pointer
                    outline-none

                    transition-colors

                    hover:bg-slate-100
                    dark:hover:bg-gray-800

                    focus:bg-slate-100
                    dark:focus:bg-gray-800

                    focus:ring-2
                    focus:ring-blue-500/20
                "
            >
                {projects.map((p) => (
                    <option
                        key={p.id}
                        value={p.id}
                        className="
                            bg-white
                            dark:bg-gray-900
                            text-slate-800
                            dark:text-gray-100
                        "
                    >
                        {p.name} ({p.key})
                    </option>
                ))}
            </select>

            <div
                className="
                    pointer-events-none
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    text-muted
                "
            >
                <ChevronDown className="w-4 h-4" />
            </div>
        </div>
    );
}