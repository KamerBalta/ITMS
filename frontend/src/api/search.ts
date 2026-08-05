import { apiClient } from './client';
import type { SearchResults } from '../types/search';

export const searchApi = {
    search: (query: string) => apiClient.get<SearchResults>('/search', { params: { q: query } }).then((res) => res.data),
    suggestions: (query: string) =>
        apiClient.get<string[]>('/search/suggestions', { params: { q: query } }).then((res) => res.data),
};