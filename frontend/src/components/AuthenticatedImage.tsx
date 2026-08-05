import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface AuthenticatedImageProps {
    src: string; // apiClient baseURL'e göre relatif path, örn. "/users/{id}/avatar"
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
    refreshKey?: number;
}

export function AuthenticatedImage({
    src,
    alt,
    className,
    fallback,
    refreshKey
}: AuthenticatedImageProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let currentUrl: string | null = null;
        let cancelled = false;

        setFailed(false);
        setObjectUrl(null);

        apiClient
            .get(src, { responseType: 'blob' })
            .then((res) => {
                if (cancelled) return;
                currentUrl = URL.createObjectURL(res.data);
                setObjectUrl(currentUrl);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });

        return () => {
            cancelled = true;
            if (currentUrl) URL.revokeObjectURL(currentUrl);
        };
    }, [src, refreshKey]);

    if (failed || !objectUrl) return <>{fallback ?? null}</>;

    return <img src={objectUrl} alt={alt} className={className} />;
}