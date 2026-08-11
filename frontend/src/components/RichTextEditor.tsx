import { useRef, useState } from 'react';
import { MentionTextarea } from './MentionTextarea';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownContent } from './MarkdownContent';
import type { ProjectMemberItem } from '../types/projectMember';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    members: ProjectMemberItem[] | undefined;
    placeholder?: string;
    rows?: number;
}

export function RichTextEditor({ value, onChange, members, placeholder, rows = 4 }: RichTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<'write' | 'preview'>('write');

    return (
        <div>
            <div className="flex items-center justify-between border-b bg-gray-50 rounded-t px-1">
                <div className="flex">
                    <button
                        type="button"
                        onClick={() => setTab('write')}
                        className={`text-xs px-3 py-1.5 border-b-2 ${tab === 'write' ? 'border-indigo-500 text-indigo-600 font-medium' : 'border-transparent text-gray-400'}`}
                    >
                        Yaz
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('preview')}
                        className={`text-xs px-3 py-1.5 border-b-2 ${tab === 'preview' ? 'border-indigo-500 text-indigo-600 font-medium' : 'border-transparent text-gray-400'}`}
                    >
                        Önizleme
                    </button>
                </div>
            </div>

            {tab === 'write' ? (
                <div>
                    <MarkdownToolbar textareaRef={textareaRef} value={value} onChange={onChange} />
                    <MentionTextarea
                        ref={textareaRef}
                        value={value}
                        onChange={onChange}
                        members={members}
                        placeholder={placeholder}
                        rows={rows}
                        className="w-full border rounded-b px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                </div>
            ) : (
                <div className="border border-t-0 rounded-b px-3 py-2 min-h-[80px] bg-white">
                    {value.trim() ? (
                        <MarkdownContent content={value} />
                    ) : (
                        <p className="text-sm text-gray-300 italic">Önizlenecek içerik yok.</p>
                    )}
                </div>
            )}
        </div>
    );
}