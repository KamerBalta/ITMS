export interface UserDetail {
    id: string;
    name: string;
    email: string;
    title: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
    roles: string[];
}
export interface UserListItem {
    id: string;
    name: string;
    email: string;
    title: string | null;
    isActive: boolean;
    roles: string[];
}