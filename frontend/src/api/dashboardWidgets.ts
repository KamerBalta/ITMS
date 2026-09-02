import { apiClient } from './client';
import type {
    DashboardWidgetItem,
    WidgetType,
} from '../types/dashboardWidget';

export const dashboardWidgetsApi = {
    getAll: (projectId: string) =>
        apiClient
            .get<DashboardWidgetItem[]>(
                `/projects/${projectId}/dashboard-widgets`
            )
            .then((res) => res.data),

    add: (
        projectId: string,
        widgetType: WidgetType,
        title: string | undefined,
        width: number
    ) =>
        apiClient.post(
            `/projects/${projectId}/dashboard-widgets`,
            {
                widgetType,
                title,
                width,
            }
        ),

    update: (
        projectId: string,
        widgetId: string,
        title: string | null,
        width: number
    ) =>
        apiClient.put(
            `/projects/${projectId}/dashboard-widgets/${widgetId}`,
            {
                title,
                width,
            }
        ),

    remove: (projectId: string, widgetId: string) =>
        apiClient.delete(
            `/projects/${projectId}/dashboard-widgets/${widgetId}`
        ),

    reorder: (projectId: string, orderedIds: string[]) =>
        apiClient.put(
            `/projects/${projectId}/dashboard-widgets/reorder`,
            { orderedIds }
        ),

    reset: (projectId: string) =>
        apiClient.post(
            `/projects/${projectId}/dashboard-widgets/reset`
        ),
};