import React from 'react';
import { Bold, Italic, Code, Link as LinkIcon, List, ListOrdered, FileCode } from 'lucide-react';

interface MarkdownToolbarProps {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    value: string;
    onChange: (value: string) => void;
}

export function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {

    // Temel sarma işlemleri (Bold, Italic, Code vb.)
    const handleWrapFormat = (prefix: string, suffix: string = prefix, defaultText: string = 'metin') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || defaultText;

        const replacement = `${prefix}${selectedText}${suffix}`;
        const newValue = value.substring(0, start) + replacement + value.substring(end);

        onChange(newValue);

        requestAnimationFrame(() => {
            textarea.focus();
            const selectionStart = start + prefix.length;
            const selectionEnd = selectionStart + selectedText.length;
            textarea.setSelectionRange(selectionStart, selectionEnd);
        });
    };

    // Bağlantı ekleme (Link)
    const handleLinkFormat = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || 'bağlantı metni';

        const replacement = `[${selectedText}](https://)`;
        const newValue = value.substring(0, start) + replacement + value.substring(end);

        onChange(newValue);

        requestAnimationFrame(() => {
            textarea.focus();
            // Imleci https:// kısmına getir
            const newCursorPos = start + selectedText.length + 3;
            textarea.setSelectionRange(newCursorPos, newCursorPos + 8);
        });
    };

    // Satır içi veya çoklu satır liste ekleme
    const handleListFormat = (type: 'ul' | 'ol') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        // Satırlara böl
        const lines = (selectedText || 'Madde').split('\n');

        const formattedLines = lines.map((line, index) => {
            // Zaten var olan liste prefix'lerini temizle (- , 1. , * gibi)
            const cleanLine = line.replace(/^([*+-]|\d+\.)\s+/, '');

            if (type === 'ul') {
                return `- ${cleanLine}`;
            } else {
                return `${index + 1}. ${cleanLine}`;
            }
        });

        // Eğer liste öncesinde boş satır yoksa, Markdown'ın doğru algılaması için önüne \n koy
        const prefix = start > 0 && value[start - 1] !== '\n' ? '\n\n' : '';
        const replacement = prefix + formattedLines.join('\n');

        const newValue = value.substring(0, start) + replacement + value.substring(end);
        onChange(newValue);

        requestAnimationFrame(() => {
            textarea.focus();
            const newCursorPos = start + replacement.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
    };

    return (
        <div className="flex items-center gap-1 p-1.5 border-b bg-gray-50 text-gray-600 rounded-t select-none">
            {/* Kalın (Bold) */}
            <button
                type="button"
                onClick={() => handleWrapFormat('**', '**', 'kalın metin')}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition"
                title="Kalın (**metin**)"
            >
                <Bold size={15} />
            </button>

            {/* İtalik (Italic) */}
            <button
                type="button"
                onClick={() => handleWrapFormat('*', '*', 'italik metin')}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition"
                title="İtalik (*metin*)"
            >
                <Italic size={15} />
            </button>

            {/* Satır İçi Kod (Inline Code) */}
            <button
                type="button"
                onClick={() => handleWrapFormat('`', '`', 'kod')}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition"
                title="Satır İçi Kod (`kod`)"
            >
                <Code size={15} />
            </button>

            {/* Kod Bloğu (Code Block) */}
            <button
                type="button"
                onClick={() => handleWrapFormat('\n```\n', '\n```\n', 'kod bloğu')}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition"
                title="Kod Bloğu (```kod```)"
            >
                <FileCode size={15} />
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1" />

            {/* Madde İşaretli Liste (Unordered List) */}
            <button
                type="button"
                onClick={() => handleListFormat('ul')}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition"
                title="Madde İşaretli Liste"
            >
                <List size={15} />
            </button>

            {/* Numaralı Liste (Ordered List) */}
            <button
                type="button"
                onClick={() => handleListFormat('ol')}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition"
                title="Numaralı Liste"
            >
                <ListOrdered size={15} />
            </button>

            {/* Bağlantı (Link) */}
            <button
                type="button"
                onClick={handleLinkFormat}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition"
                title="Bağlantı Ekle ([metin](url))"
            >
                <LinkIcon size={15} />
            </button>
        </div>
    );
}