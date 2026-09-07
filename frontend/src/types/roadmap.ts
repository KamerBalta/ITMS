export interface RoadmapEpic {
    id: string;
    issueKey: string;
    title: string;
    status: string;
    color: string | null;
    earliestSprintStart: string | null;
    latestSprintEnd: string | null;
    totalTasks: number;
    doneTasks: number;
}
export interface RoadmapDependency {
    fromEpicId: string;
    toEpicId: string;
    linkType: string;
}

export interface RoadmapData {
    epics: RoadmapEpic[];
    dependencies: RoadmapDependency[];
}