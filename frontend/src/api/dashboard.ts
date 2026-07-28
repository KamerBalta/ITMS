import { apiClient } from './client';
import type { DashboardSummary, WorkloadItem } from '../types/dashboard';

export const dashboardApi = {
    getSummary: (projectId: string) =>
        apiClient.get<DashboardSummary>('/dashboard', { params: { projectId } }).then((res) => res.data),

    getWorkload: (projectId: string) =>
        apiClient.get<WorkloadItem[]>('/dashboard/workload', { params: { projectId } }).then((res) => res.data),
};