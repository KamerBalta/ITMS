import { useState } from 'react';

interface WidgetFrameProps {
    title: string;
    width: 1 | 2;
    editMode: boolean;
    onRemove: () => void;
    onTitleChange: (title: string) => void;
    onWidthToggle: () => void;
    draggable: boolean;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
    isDragOver: boolean;
    children: React.ReactNode;
}

export function WidgetFrame({ title, width, editMode, onRemove, onTitleChange, onWidthToggle, draggable, onDragStart, onDragOver, onDrop, isDragOver, children }: WidgetFrameProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(title);

    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`surface border rounded-lg p-4 transition-colors ${width === 2 ? 'md:col-span-2' : ''} ${isDragOver ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''
                } ${editMode ? 'cursor-move' : ''}`}
        >
            <div className="flex items-center justify-between mb-3">
                {isEditingTitle ? (
                    <input
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={() => { onTitleChange(titleDraft); setIsEditingTitle(false); }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        autoFocus
                        className="input-base border rounded px-2 py-1 text-sm font-semibold"
                    />
                ) : (
                    <h2
                        className={`font-semibold text-primary ${editMode ? 'cursor-text hover:underline' : ''}`}
                        onClick={() => editMode && setIsEditingTitle(true)}
                    >
                        {editMode && <span className="text-muted mr-1.5">⠿</span>}
                        {title}
                    </h2>
                )}

                {editMode && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={onWidthToggle} className="text-xs text-muted hover:text-secondary" title="Genişliği değiştir">
                            {width === 2 ? '◧ Daralt' : '◨ Genişlet'}
                        </button>
                        <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-600">✕ Kaldır</button>
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}