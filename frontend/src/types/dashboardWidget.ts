export type WidgetType = 'StatusSummary' | 'OverviewCards' | 'Burndown' | 'Velocity' | 'Workload' | 'MyOpenTasks' | 'RoadmapProgress' | 'QuickLinks';

export interface DashboardWidgetItem {
    id: string;
    widgetType: WidgetType;
    title: string | null;
    width: 1 | 2;
    displayOrder: number;
}

export const WIDGET_LABELS: Record<WidgetType, string> = {
    StatusSummary: 'Durum Özeti (kartlar)',
    OverviewCards: 'Genel Bakış (toplam/geciken/sprint)',
    Burndown: 'Burndown Chart',
    Velocity: 'Velocity Grafiği',
    Workload: 'Takım İş Yükü',
    MyOpenTasks: 'Açık Görevlerim',
    RoadmapProgress: 'Roadmap İlerlemesi',
    QuickLinks: 'Hızlı Erişim',
};