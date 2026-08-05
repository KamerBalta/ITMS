export interface ProjectListItem {
    id: string;
    name: string;
    key: string;
    description: string | null;
    ownerName: string;
    status: string;
    teams: { teamId: string; teamName: string }[];
}

export interface ProjectDetail {
    id: string;
    name: string;
    key: string;
    description: string | null;
    ownerName: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    teamNames: string[];
    memberCount: number;
    taskCount: number;
}