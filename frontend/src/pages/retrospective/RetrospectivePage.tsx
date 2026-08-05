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
        iconColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50/60',
        borderColor: 'border-emerald-200/60',
    },
    {
        key: 'WentWrong',
        label: 'Geliştirilecekler',
        icon: ThumbsDown,
        iconColor: 'text-rose-600',
        bgColor: 'bg-rose-50/60',
        borderColor: 'border-rose-200/60',
    },
    {
        key: 'ActionItem',
        label: 'Aksiyonlar',
        icon: CheckSquare,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50/60',
        borderColor: 'border-blue-200/60',
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
        return <p className="text-slate-500 text-sm p-4">Devam etmek için üstten bir proje seçin.</p>;
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Retrospective</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
                        {selectedSprint ? (
                            <>
                                <span className="font-medium text-slate-700">{selectedSprint.name}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-semibold text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                    Completed
                                </span>
                            </>
                        ) : (
                            'Tamamlanan sprint için ekip değerlendirmesi yapın.'
                        )}
                    </p>
                </div>

              
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                        Sprint:
                    </span>
                    <select
                        value={selectedSprintId}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                        className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
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
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50">
                                        <div className="flex items-center gap-2">
                                            <IconComponent className={`w-4 h-4 ${col.iconColor}`} />
                                            <p className="font-semibold text-sm text-slate-800">{col.label}</p>
                                        </div>
                                        <span className="text-[11px] bg-white/80 border border-slate-200 text-slate-600 font-bold rounded-full px-2 py-0.5">
                                            {columnNotes.length}
                                        </span>
                                    </div>

                                    {/* Not Kartları */}
                                    {columnNotes.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-400 italic">
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
                                                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3 transition text-slate-800 space-y-2.5"
                                                    >
                                                        {col.key === 'ActionItem' ? (
                                                            <div
                                                                onClick={() => toggleActionItem.mutate(n.id)}
                                                                className="flex items-start gap-2.5 cursor-pointer select-none group"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="mt-0.5 text-slate-400 group-hover:text-blue-600 transition shrink-0"
                                                                >
                                                                    {n.isResolved ? (
                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50 shrink-0" />
                                                                    ) : (
                                                                        <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    )}
                                                                </button>
                                                                <span
                                                                    className={`text-xs leading-relaxed font-medium ${n.isResolved
                                                                            ? 'line-through text-slate-400'
                                                                            : 'text-slate-800'
                                                                        }`}
                                                                >
                                                                    {n.content}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                                                                {n.content}
                                                            </p>
                                                        )}

                                                        {/* Kullanıcı Avatarı & Adı */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                                                    {n.userId ? (
                                                                        <AuthenticatedImage
                                                                            src={`/users/${n.userId}/avatar`}
                                                                            refreshKey={avatarRefreshKey}
                                                                            alt={n.userName}
                                                                            className="w-full h-full object-cover"
                                                                            fallback={
                                                                                <div className="w-full h-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center">
                                                                                    {initials}
                                                                                </div>
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center">
                                                                            {initials}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-slate-500 font-medium truncate">
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

                               
                                <div className="pt-2 border-t border-slate-200/50">
                                    {isAdding ? (
                                        <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 shadow-2xs">
                                            <textarea
                                                autoFocus
                                                placeholder="Add your feedback..."
                                                value={drafts[col.key]}
                                                onChange={(e) =>
                                                    setDrafts((prev) => ({ ...prev, [col.key]: e.target.value }))
                                                }
                                                rows={3}
                                                className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400 resize-none"
                                            />
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setAddingCategory(null)}
                                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition"
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
                                            className="w-full flex items-center justify-center gap-1.5 bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 font-semibold rounded-lg py-1.5 text-xs text-slate-700 transition cursor-pointer shadow-2xs"
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