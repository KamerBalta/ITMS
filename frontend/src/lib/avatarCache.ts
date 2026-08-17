// Ayni kullanicinin avatari birden fazla yerde (Board kartlari, Comments, Watchers vb.)
// gorunebiliyor -- her mount'ta ayri fetch atmak yerine, blob URL'lerini bellekte
// paylasilan bir Map'te tutuyoruz. Sekme kapaninca dogal olarak temizlenir.
const cache = new Map<string, Promise<string | null>>();

export function getCachedAvatarBlobUrl(fetchFn: () => Promise<Blob>, cacheKey: string): Promise<string | null> {
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
}