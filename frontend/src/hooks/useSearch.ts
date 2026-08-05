import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search';

function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
}

export function useSearchResults(query: string) {
    const debouncedQuery = useDebouncedValue(query, 350);
    return useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: () => searchApi.search(debouncedQuery),
        enabled: debouncedQuery.trim().length >= 2,
    });
}

export function useSearchSuggestions(query: string) {
    const debouncedQuery = useDebouncedValue(query, 200); // suggestions daha hizli tepki vermeli
    return useQuery({
        queryKey: ['search-suggestions', debouncedQuery],
        queryFn: () => searchApi.suggestions(debouncedQuery),
        enabled: debouncedQuery.trim().length >= 2,
    });
}