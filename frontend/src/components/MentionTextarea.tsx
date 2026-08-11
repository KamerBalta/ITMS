import {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
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
 * Backend formatını kullanıcıya gösterilecek formata çevirir.
 * @[Ayşe Demir](uuid) -> @Ayşe Demir
 */
function displayValue(value: string): string {
    if (!value) return '';
    return value.replace(MENTION_PATTERN, '@$1');
}

export const MentionTextarea = forwardRef<
    HTMLTextAreaElement,
    MentionTextareaProps
>(function MentionTextarea(
    {
        value,
        onChange,
        members,
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

    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStartIndex, setMentionStartIndex] = useState(0);

    const displayText = displayValue(value);

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

    /**
     * Düz yazma/silme esnasında:
     * Ekrandaki metinde var olan mention'lar bozulmadıysa UUID'lerini korur,
     * silindilerse temizler ve backend formatını günceller.
     */
    const syncEncodedValue = (currentDisplayText: string, originalEncodedValue: string) => {
        let updatedEncoded = originalEncodedValue;

        // Backend formatındaki tüm mention'ları bul
        const matches = [...originalEncodedValue.matchAll(MENTION_PATTERN)];

        for (const match of matches) {
            const fullMatch = match[0]; // @[Ayşe Demir](uuid)
            const userName = match[1];  // Ayşe Demir
            const displayMention = `@${userName}`;

            // Eğer kullanıcı ekrandan bu mention'ı kısmen veya tamamen sildiyse
            if (!currentDisplayText.includes(displayMention)) {
                updatedEncoded = updatedEncoded.replace(fullMatch, displayMention);
            }
        }

        // Düz metin değişikliklerini senkronize et
        if (!updatedEncoded.includes('@[')) {
            // Hiç mention kalmadıysa direkt ekrandaki metni ver
            return currentDisplayText;
        }

        return updatedEncoded;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newDisplayText = e.target.value;
        const cursorPos = e.target.selectionStart;

        // Arka plan verisini güncelle
        const nextEncodedValue = syncEncodedValue(newDisplayText, value);
        onChange(nextEncodedValue);

        // Arama (Query) Kontrolü
        const textBeforeCursor = newDisplayText.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex === -1) {
            setMentionQuery(null);
            return;
        }

        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

        // Boşluk veya yeni satır varsa mention aramasını kapat
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
        const currentDisplayText = displayValue(value);

        // Ekran metni için
        const displayBefore = currentDisplayText.slice(0, mentionStartIndex);
        const displayAfter = currentDisplayText.slice(cursorPos);
        const displayMention = `@${member.userName}`;

        // Backend metni için
        const encodedMention = `@[${member.userName}](${member.userId})`;

        // Kullanıcıya görünecek yeni metin
        const newDisplayText = `${displayBefore}${displayMention} ${displayAfter}`;

        // Arka plana gidecek yeni metin (Var olan UUID'leri koruyarak yeni UUID'yi yerleştirir)
        let newEncodedValue = value;

        // Eğer ilk defa mention ekleniyorsa veya aramadan yerleştiriliyorsa
        const searchTarget = `@${mentionQuery}`;
        if (mentionQuery !== null && newEncodedValue.includes(searchTarget)) {
            newEncodedValue = newEncodedValue.replace(searchTarget, encodedMention);
        } else {
            // Alternatif güvenli yerleştirme
            const encodedBefore = displayValueToEncodedIndex(value, mentionStartIndex);
            newEncodedValue = `${value.slice(0, encodedBefore)}${encodedMention} ${value.slice(encodedBefore + (cursorPos - mentionStartIndex))}`;
        }

        // Tam eşleşme garantisi için fallback
        if (!newEncodedValue.includes(member.userId)) {
            newEncodedValue = newDisplayText.replace(displayMention, encodedMention);
        }

        onChange(newEncodedValue);
        setMentionQuery(null);

        requestAnimationFrame(() => {
            const newCursorPos = displayBefore.length + displayMention.length + 1;
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
    };

    // Ekrandaki index ile Backend metnindeki index'i hizalama yardımcısı
    const displayValueToEncodedIndex = (encoded: string, displayIndex: number): number => {
        let currentDisplayLen = 0;
        let currentEncodedLen = 0;

        const matches = [...encoded.matchAll(MENTION_PATTERN)];
        let lastIndex = 0;

        for (const match of matches) {
            const matchIndex = match.index!;
            const textBefore = encoded.slice(lastIndex, matchIndex);

            if (currentDisplayLen + textBefore.length >= displayIndex) {
                return currentEncodedLen + (displayIndex - currentDisplayLen);
            }

            currentDisplayLen += textBefore.length + match[1].length + 1; // +1 for @
            currentEncodedLen += textBefore.length + match[0].length;
            lastIndex = matchIndex + match[0].length;
        }

        return currentEncodedLen + (displayIndex - currentDisplayLen);
    };

    return (
        <div className="relative">
            <textarea
                ref={innerRef}
                value={displayText}
                onChange={handleChange}
                placeholder={placeholder}
                rows={rows}
                className={className}
            />

            {mentionQuery !== null && suggestions.length > 0 && (
                <div className="absolute z-10 bottom-full mb-1 left-0 bg-white border rounded-lg shadow-lg w-56 max-h-40 overflow-y-auto">
                    {suggestions.map((member) => (
                        <button
                            key={member.userId}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectMention(member);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center justify-between"
                        >
                            <span>{member.userName}</span>
                            <span className="text-xs text-gray-400">
                                {member.teamName}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});