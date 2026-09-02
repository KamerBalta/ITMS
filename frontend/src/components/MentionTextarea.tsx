import {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
} from 'react';
import type { ProjectMemberItem } from '../types/projectMember';

interface MentionTextareaProps {
    value: string;
    onChange: (value: string) => void;
    members: ProjectMemberItem[] | undefined;
    placeholder?: string;
    rows?: number;
    className?: string;
}

const MENTION_PATTERN = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

/**
 * Backend formatını (@[İsim](uuid)) -> @İsim haline getirir
 */
function decodeMentions(encoded: string): string {
    if (!encoded) return '';
    return encoded.replace(MENTION_PATTERN, '@$1');
}

export const MentionTextarea = forwardRef<
    HTMLTextAreaElement,
    MentionTextareaProps
>(function MentionTextarea(
    {
        value,
        onChange,
        members = [],
        placeholder,
        rows = 2,
        className,
    },
    forwardedRef
) {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(
        forwardedRef,
        () => innerRef.current as HTMLTextAreaElement
    );

    // Ekranda görünen metin state'i
    const [text, setText] = useState(() => decodeMentions(value));
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStartIndex, setMentionStartIndex] = useState(0);

    // Dışarıdan value tamamen sıfırlandığında (örn: Gönder butonuna basılınca) iç state'i senkronize et
    useEffect(() => {
        const decoded = decodeMentions(value);
        if (decoded !== text && (value === '' || !value.includes('@['))) {
            setText(decoded);
        }
    }, [value]);

    // Düz metindeki @İsim ifadelerini @[İsim](uuid) haline çevirip onChange tetikler
    const emitEncodedChange = (newText: string) => {
        let encoded = newText;
        if (members && members.length > 0) {
            for (const member of members) {
                const mentionPattern = new RegExp(`@${member.userName}(?![a-zA-Z0-9_])`, 'g');
                encoded = encoded.replace(
                    mentionPattern,
                    `@[${member.userName}](${member.userId})`
                );
            }
        }
        onChange(encoded);
    };

    const suggestions =
        mentionQuery !== null
            ? (members ?? [])
                .filter((m) =>
                    m.userName
                        .toLowerCase()
                        .includes(mentionQuery.toLowerCase())
                )
                .slice(0, 5)
            : [];

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newDisplayText = e.target.value;
        const cursorPos = e.target.selectionStart;

        setText(newDisplayText);
        emitEncodedChange(newDisplayText);

        // Mention Arama Kontrolü
        const textBeforeCursor = newDisplayText.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex === -1) {
            setMentionQuery(null);
            return;
        }

        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

        // @ işaretinden sonra boşluk veya alt satır varsa öneri listesini kapat
        if (/\s/.test(textAfterAt)) {
            setMentionQuery(null);
            return;
        }

        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
    };

    const handleSelectMention = (member: ProjectMemberItem) => {
        const textarea = innerRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;

        const textBefore = text.slice(0, mentionStartIndex);
        const textAfter = text.slice(cursorPos);
        const mentionText = `@${member.userName} `;

        const updatedText = `${textBefore}${mentionText}${textAfter}`;

        setText(updatedText);
        emitEncodedChange(updatedText);
        setMentionQuery(null);

        // İmleci seçilen ismin ve bırakılan boşluğun sonuna taşı
        const nextCursorPos = mentionStartIndex + mentionText.length;
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(nextCursorPos, nextCursorPos);
        });
    };

    return (
        <div className="relative">
            <textarea
                ref={innerRef}
                value={text}
                onChange={handleChange}
                placeholder={placeholder}
                rows={rows}
                className={className}
            />

            {mentionQuery !== null && suggestions.length > 0 && (
                <div className="absolute z-50 bottom-full mb-1 left-0 surface border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg shadow-lg w-56 max-h-40 overflow-y-auto">
                    {suggestions.map((member) => (
                        <button
                            key={member.userId}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectMention(member);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center justify-between cursor-pointer transition-colors"
                        >
                            <span className="font-medium text-slate-800 dark:text-gray-200">
                                {member.userName}
                            </span>
                            <span className="text-xs text-muted">
                                {member.teamName}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});