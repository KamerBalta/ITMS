import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '../api/automation';

export function useAutomationRules(projectId: string | null) {
    return useQuery({
        queryKey: ['automation-rules', projectId],
        queryFn: () => automationApi.getAll(projectId!),
        enabled: !!projectId,
    });
}

export function useCreateAutomationRule(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; triggerType: string; triggerConditionJson?: string; actionType: string; actionParamsJson: string }) =>
            automationApi.create(projectId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules', projectId] }),
    });
}

export function useToggleAutomationRule(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ruleId: string) => automationApi.toggle(projectId, ruleId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules', projectId] }),
    });
}

export function useDeleteAutomationRule(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ruleId: string) => automationApi.delete(projectId, ruleId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules', projectId] }),
    });
}