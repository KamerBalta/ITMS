import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface OnboardingStatus {
    hasAnyTeam: boolean;
    hasAnyProject: boolean;
    isMemberOfAnyTeam: boolean;
    hasAnyTaskAssigned: boolean;
}

export function useOnboardingStatus() {
    return useQuery({
        queryKey: ['onboarding-status'],
        queryFn: () => apiClient.get<OnboardingStatus>('/onboarding/status').then((res) => res.data),
        staleTime: 60_000,
    });
}