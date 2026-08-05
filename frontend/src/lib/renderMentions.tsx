import React from 'react';

const MENTION_PATTERN = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

// "@[Ahmet Yılmaz](guid)" -> ekranda "@Ahmet Yılmaz" (vurgulu span), backend'e giden ham metin değişmez
export function renderMentions(content: string) {
    const parts: (string | { name: string; key: string })[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    MENTION_PATTERN.lastIndex = 0;
    while ((match = MENTION_PATTERN.exec(content)) !== null) {
        if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
        parts.push({ name: match[1], key: `${match.index}-${match[2]}` });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) parts.push(content.slice(lastIndex));

    return parts.map((part, i) =>
        typeof part === 'string' ? (
            <React.Fragment key={i}>{part}</React.Fragment>
        ) : (
            <span
                key={part.key}
                className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-blue-700 font-medium mx-0.5"
            >
                @{part.name}
            </span>
        )
    );
}