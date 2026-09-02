import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Genel varsayilan: 30sn "taze" sayilir -- ayni veriye kisa sure icinde
            // birden fazla component erisirse tek network istegi paylasilir.
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false, // sekme degistirip geri donunce gereksiz refetch yapma
            retry: 1,
        },
    },
});

// #Perf: referans/konfigurasyon verisi (Label, Component, CustomField, IssueType,
// WorkflowStatus, BoardColumn, ProjectMembers) dakikalarca degismiyor -- bunlari
// "reference" query key prefix'i altinda daha uzun staleTime ile isaretliyoruz.
// Kullanim: queryOptions() yardimcisiyla ilgili hook'larda staleTime: REFERENCE_STALE_TIME.
export const REFERENCE_STALE_TIME = 5 * 60_000; // 5 dakika