import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { getCachedAvatarBlobUrl } from '../lib/avatarCache';

interface AuthenticatedImageProps {
    src: string; // apiClient baseURL'e göre relatif path, örn. "/users/{id}/avatar"
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
    cacheKey?: string; // Verilirse paylaşılan cache kullanılır (avatar gibi tekrar eden görseller için)
    refreshKey?: number;
}

export function AuthenticatedImage({
    src,
    alt,
    className,
    fallback,
    cacheKey,
    refreshKey,
}: AuthenticatedImageProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let currentUrl: string | null = null;
        let cancelled = false;

        setFailed(false);
        setObjectUrl(null);

        const fetchBlob = () =>
            apiClient.get(src, { responseType: 'blob' }).then((res) => res.data as Blob);

        const resultPromise = cacheKey
            ? getCachedAvatarBlobUrl(fetchBlob, cacheKey)
            : fetchBlob()
                .then((blob) => {
                    currentUrl = URL.createObjectURL(blob);
                    return currentUrl;
                })
                .catch(() => null);

        resultPromise.then((url) => {
            if (cancelled) return;
            if (url) {
                setObjectUrl(url);
            } else {
                setFailed(true);
            }
        });

        return () => {
            cancelled = true;
            // cacheKey kullanılmadığında (tek seferlik URL oluşturulduğunda) belleği temizle
            if (!cacheKey && currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [src, cacheKey, refreshKey]);

    if (failed || !objectUrl) return <>{fallback ?? null}</>;

    return <img src={objectUrl} alt={alt} className={className} />;
}