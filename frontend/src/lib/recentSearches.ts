const KEY = 'infera_recent_searches';
const MAX_ITEMS = 5;

export function getRecentSearches(): string[] {
    try {
        return JSON.parse(localStorage.getItem(KEY) ?? '[]');
    } catch {
        return [];
    }
}

export function addRecentSearch(query: string) {
    if (!query.trim()) return;
    const current = getRecentSearches().filter((q) => q !== query);
    const updated = [query, ...current].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(updated));
}

export function clearRecentSearches() {
    localStorage.removeItem(KEY);
}