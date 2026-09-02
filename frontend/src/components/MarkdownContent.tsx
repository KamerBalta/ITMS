import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MENTION_PATTERN = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

function preprocessMarkdown(content: string): string {
    if (!content) return '';

    let processed = content;

    // 1. Mention dönüşümü
    processed = processed.replace(MENTION_PATTERN, (_match, name) => `@${name}`);

    // 2. Paragraf sonrasındaki liste başlangıçlarını (boş satırsız yazılmışsa) otomatik ayır
    // Örn: "metin\n- madde" -> "metin\n\n- madde"
    processed = processed.replace(/([^\n])\n([ \t]*[-*+]|[ \t]*\d+\.)/g, '$1\n\n$2');

    return processed;
}

export function MarkdownContent({ content }: { content: string }) {
    const processed = preprocessMarkdown(content);

    return (
        <div className="text-sm leading-relaxed text-gray-800">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Liste Elemanlarının Ekranda Kesin Liste Olarak Görünmesi
                    ul: ({ children }) => (
                        <ul className="list-disc pl-6 my-3 space-y-1 text-gray-800">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal pl-6 my-3 space-y-1 text-gray-800">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-normal">
                            {children}
                        </li>
                    ),
                    p: ({ children }) => (
                        <p className="my-2 leading-relaxed">
                            {children}
                        </p>
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline break-all"
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {processed}
            </ReactMarkdown>
        </div>
    );
}