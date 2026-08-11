import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSprints } from '../../hooks/useSprints';
import { useRetrospectiveNotes, useAddRetrospectiveNote, useToggleActionItem } from '../../hooks/useRetrospective';
import { useAuthStore } from '../../store/authStore';
import { AuthenticatedImage } from '../../components/AuthenticatedImage';
import type { RetroCategory } from '../../types/retrospective';
import type { LucideIcon } from 'lucide-react';
import {
    ThumbsUp,
    ThumbsDown,
    CheckSquare,
    Plus,
    Circle,
    CheckCircle2,
    Calendar,
    MessageSquare,
    X
} from 'lucide-react';

interface RetroColumnConfig {
    key: RetroCategory;
    label: string;
    icon: LucideIcon;
    iconColor: string;
    bgColor: string;
    borderColor: string;
}

const COLUMNS: RetroColumnConfig[] = [
    {
        key: 'WentWell',
        label: 'İyi Gidenler',
        icon: ThumbsUp,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50/60 dark:bg-emerald-950/30',
        borderColor: 'border-emerald-200/60 dark:border-emerald-900/50',
    },
    {
        key: 'WentWrong',
        label: 'Geliştirilecekler',
        icon: ThumbsDown,
        iconColor: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50/60 dark:bg-rose-950/30',
        borderColor: 'border-rose-200/60 dark:border-rose-900/50',
    },
    {
        key: 'ActionItem',
        label: 'Aksiyonlar',
        icon: CheckSquare,
        iconColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50/60 dark:bg-blue-950/30',
        borderColor: 'border-blue-200/60 dark:border-blue-900/50',
    },
];

export function RetrospectivePage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const avatarRefreshKey = useAuthStore((state) => state.avatarRefreshKey);
    const { data: sprints } = useSprints(selectedProjectId);
    const completedSprints = sprints?.filter((s) => s.status === 'Completed') ?? [];

    const [selectedSprintId, setSelectedSprintId] = useState<string>('');
    const { data: notes } = useRetrospectiveNotes(selectedSprintId || null);
    const addNote = useAddRetrospectiveNote(selectedSprintId);
    const toggleActionItem = useToggleActionItem(selectedSprintId);

    // Her kolon için kart ekleme açık/kapalı durumu
    const [addingCategory, setAddingCategory] = useState<RetroCategory | null>(null);

    const [drafts, setDrafts] = useState<Record<RetroCategory, string>>({
        WentWell: '',
        WentWrong: '',
        ActionItem: '',
    });

    if (!selectedProjectId) {
        return <p className="text-secondary text-sm p-4">Devam etmek için üstten bir proje seçin.</p>;
    }

    const selectedSprint = completedSprints.find((s) => s.id === selectedSprintId);

    const handleAdd = async (category: RetroCategory) => {
        const content = drafts[category].trim();
        if (!content) return;
        await addNote.mutateAsync({ category, content });
        setDrafts((prev) => ({ ...prev, [category]: '' }));
        setAddingCategory(null);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-primary">Retrospective</h1>
                    <p className="text-xs sm:text-sm text-secondary mt-1 flex items-center gap-2">
                        {selectedSprint ? (
                            <>
                                <span className="font-medium text-primary">{selectedSprint.name}</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                                    Completed
                                </span>
                            </>
                        ) : (
                            'Tamamlanan sprint için ekip değerlendirmesi yapın.'
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider hidden sm:inline">
                        Sprint:
                    </span>
                    <select
                        value={selectedSprintId}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                        className="w-full sm:w-auto input-base border rounded-lg px-3 py-2 text-xs font-semibold text-secondary shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="">Tamamlanmış bir sprint seçin...</option>
                        {completedSprints.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {completedSprints.length === 0 && (
                <div className="surface border rounded-xl p-8 text-center text-muted text-sm">
                    Retrospective yapabilmek için henüz tamamlanmış bir sprint yok.
                </div>
            )}

            {/* Retrospective Tahtası */}
            {selectedSprintId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                    {COLUMNS.map((col) => {
                        const IconComponent = col.icon;
                        const columnNotes = notes?.filter((n) => n.category === col.key) ?? [];
                        const isAdding = addingCategory === col.key;

                        return (
                            <div
                                key={col.key}
                                className={`${col.bgColor} rounded-xl border ${col.borderColor} min-h-[420px] p-4 flex flex-col justify-between transition-all`}
                            >
                                <div>
                                    {/* Kolon Başlığı, İkonu & Sayaç */}
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                                        <div className="flex items-center gap-2">
                                            <IconComponent className={`w-4 h-4 ${col.iconColor}`} />
                                            <p className="font-semibold text-sm text-primary">{col.label}</p>
                                        </div>
                                        <span className="text-[11px] surface border text-secondary font-bold rounded-full px-2 py-0.5">
                                            {columnNotes.length}
                                        </span>
                                    </div>

                                    {/* Not Kartları */}
                                    {columnNotes.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-muted italic">
                                            No notes yet
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5 mb-4">
                                            {columnNotes.map((n) => {
                                                const initials = n.userName
                                                    ? n.userName
                                                        .split(' ')
                                                        .map((word) => word[0])
                                                        .join('')
                                                        .toUpperCase()
                                                        .slice(0, 2)
                                                    : 'U';

                                                return (
                                                    <div
                                                        key={n.id}
                                                        className="surface border hover:border-gray-300 dark:hover:border-gray-600 rounded-lg p-3 shadow-sm transition text-primary space-y-2.5"
                                                    >
                                                        {col.key === 'ActionItem' ? (
                                                            <div
                                                                onClick={() => toggleActionItem.mutate(n.id)}
                                                                className="flex items-start gap-2.5 cursor-pointer select-none group"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="mt-0.5 text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400 transition shrink-0 cursor-pointer"
                                                                >
                                                                    {n.isResolved ? (
                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-50 dark:fill-emerald-950/50 shrink-0" />
                                                                    ) : (
                                                                        <Circle className="w-4 h-4 text-muted shrink-0" />
                                                                    )}
                                                                </button>
                                                                <span
                                                                    className={`text-xs leading-relaxed font-medium ${n.isResolved
                                                                        ? 'line-through text-muted'
                                                                        : 'text-primary'
                                                                        }`}
                                                                >
                                                                    {n.content}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-primary leading-relaxed font-medium whitespace-pre-wrap">
                                                                {n.content}
                                                            </p>
                                                        )}

                                                        {/* Kullanıcı Avatarı & Adı */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                                                                    {n.userId ? (
                                                                        <AuthenticatedImage
                                                                            src={`/users/${n.userId}/avatar`}
                                                                            refreshKey={avatarRefreshKey}
                                                                            alt={n.userName}
                                                                            className="w-full h-full object-cover"
                                                                            fallback={
                                                                                <div className="w-full h-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold flex items-center justify-center">
                                                                                    {initials}
                                                                                </div>
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full surface-muted text-secondary text-[9px] font-bold flex items-center justify-center">
                                                                            {initials}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-muted font-medium truncate">
                                                                    {n.userName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                    {isAdding ? (
                                        <div className="surface border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 space-y-2 shadow-2xs">
                                            <textarea
                                                autoFocus
                                                placeholder="Add your feedback..."
                                                value={drafts[col.key]}
                                                onChange={(e) =>
                                                    setDrafts((prev) => ({ ...prev, [col.key]: e.target.value }))
                                                }
                                                rows={3}
                                                className="w-full input-base border border-gray-200 dark:border-gray-700 rounded-md p-2 text-xs focus:outline-none focus:border-blue-500 text-primary placeholder:text-muted resize-none"
                                            />
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setAddingCategory(null)}
                                                    className="p-1 text-muted hover:text-secondary rounded-md hover-surface transition cursor-pointer"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdd(col.key)}
                                                    disabled={!drafts[col.key].trim()}
                                                    className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setAddingCategory(col.key)}
                                            className="w-full flex items-center justify-center gap-1.5 surface hover-surface border border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 font-semibold rounded-lg py-1.5 text-xs text-secondary transition cursor-pointer shadow-2xs"
                                        >
                                            <Plus size={14} className="stroke-[2.5]" />
                                            <span>Add card</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}