import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { getCachedAvatarBlobUrl } from '../lib/avatarCache';

interface AuthenticatedImageProps {
    src: string;
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
    cacheKey?: string;
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
    const [image, setImage] = useState<{
        key: string;
        url: string | null;
        failed: boolean;
    }>({
        key: '',
        url: null,
        failed: false,
    });

    const imageKey = `${src}:${cacheKey ?? ''}:${refreshKey ?? 0}`;

    useEffect(() => {
        let cancelled = false;
        let currentUrl: string | null = null;

        const fetchBlob = () =>
            apiClient
                .get(src, { responseType: 'blob' })
                .then((res) => res.data as Blob);

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

            setImage({
                key: imageKey,
                url,
                failed: !url,
            });
        });

        return () => {
            cancelled = true;

            if (!cacheKey && currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [src, cacheKey, refreshKey, imageKey]);

    if (image.key !== imageKey || image.failed || !image.url) {
        return <>{fallback ?? null}</>;
    }

    return (
        <img
            src={image.url}
            alt={alt}
            className={className}
        />
    );
}