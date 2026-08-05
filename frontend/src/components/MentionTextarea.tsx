import { MentionsInput, Mention } from 'react-mentions';

type MentionTextareaProps = {
    value: string;
    onChange: (value: string) => void;
    members?: {
        userId: string;
        userName: string;
    }[];
    placeholder?: string;
    rows?: number;
};

const mentionStyle = {
    control: {
        backgroundColor: '#fff',
        fontSize: 14,
        lineHeight: '20px',
        fontFamily: 'inherit',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
    },
    '&multiLine': {
        control: {
            fontFamily: 'inherit',
            minHeight: 63,
        },
        highlighter: {
            padding: 10,
            border: '1px solid transparent',
            boxSizing: 'border-box',
            overflow: 'hidden',
        },
        input: {
            padding: 10,
            margin: 0,
            border: '1px solid transparent',
            outline: 'none',
            boxSizing: 'border-box',
        },
    },
    suggestions: {
        list: {
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: 14,
            overflow: 'hidden',
            zIndex: 99999,
        },
        item: {
            padding: 0,
            borderBottom: '1px solid #f3f4f6',
            '&focused': {
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                fontWeight: 600,
            },
        },
    },
};

export function MentionTextarea({
    value,
    onChange,
    members,
    placeholder,
    rows = 4,
}: MentionTextareaProps) {
    const mentionData = (members ?? []).map((m) => ({
        id: m.userId,
        display: m.userName,
    }));

    return (
        <MentionsInput
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={mentionStyle}
            rows={rows}
        >
            <Mention
                trigger="@"
                data={mentionData}
                markup="@[__display__](__id__)"
                displayTransform={(_, display) => `@${display}`}
                appendSpaceOnAdd
                style={{
                    backgroundColor: '#e0e7ff',
                    color: 'transparent', // Katmandaki metin rengi saydam yapıldı, böylece çakışıp gölge yapmaz!
                    borderRadius: '4px',
                }}
                renderSuggestion={(entry) => (
                    <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer transition">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-200 shrink-0">
                            {entry.display ? entry.display[0].toUpperCase() : 'U'}
                        </div>
                        <span className="text-sm text-gray-800 font-medium">{entry.display}</span>
                    </div>
                )}
            />
        </MentionsInput>
    );
}