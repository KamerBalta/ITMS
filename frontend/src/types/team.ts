export interface TeamListItem {
    id: string;
    name: string;
    description: string | null;
    members: { userId: string; userName: string; teamRole: string }[];
}

export interface TeamDetail {
    id: string;
    name: string;
    description: string | null;
    createdByName: string;
    members: { userId: string; userName: string; teamRole: string }[];
    activeProjects: string[];
}