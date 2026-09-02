const cache = new Map<string, Promise<string | null>>();

const listeners = new Set<() => void>();

export function subscribeAvatarCache(listener: () => void) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

function notifyAvatarCacheChanged() {
    listeners.forEach((listener) => listener());
}

export function getCachedAvatarBlobUrl(
    fetchFn: () => Promise<Blob>,
    cacheKey: string
): Promise<string | null> {
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
    }

    const promise = fetchFn()
        .then((blob) => URL.createObjectURL(blob))
        .catch(() => null);

    cache.set(cacheKey, promise);

    return promise;
}

export function invalidateAvatarCache(cacheKey: string) {
    cache.delete(cacheKey);
    notifyAvatarCacheChanged();
}