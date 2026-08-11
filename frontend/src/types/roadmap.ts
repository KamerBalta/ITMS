export interface RoadmapEpic {
    id: string;
    title: string;
    status: string;
    color: string | null;
    earliestSprintStart: string | null;
    latestSprintEnd: string | null;
    totalTasks: number;
    doneTasks: number;
}