import { apiClient } from './client';
import type { DashboardSummary, WorkloadItem, VelocityItem, BurndownData } from '../types/dashboard';

export const dashboardApi = {
    getSummary: (projectId: string) =>
        apiClient.get<DashboardSummary>('/dashboard', { params: { projectId } }).then((res) => res.data),

    getWorkload: (projectId: string) =>
        apiClient.get<WorkloadItem[]>('/dashboard/workload', { params: { projectId } }).then((res) => res.data),

    getVelocity: (projectId: string) =>
        apiClient.get<VelocityItem[]>('/dashboard/velocity', { params: { projectId } }).then((res) => res.data),

    getBurndown: (sprintId: string) =>
        apiClient.get<BurndownData>('/dashboard/burndown', { params: { sprintId } }).then((res) => res.data),
};