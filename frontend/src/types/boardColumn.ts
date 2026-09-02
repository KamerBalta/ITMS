export interface BoardColumnStatus {
    id: string;
    name: string;
    category: string;
}
export interface BoardColumnItem {
    id: string;
    name: string;
    displayOrder: number;
    statuses: BoardColumnStatus[];
}
export interface BoardColumnSetting {
    boardColumnId: string;
    wipLimit: number | null;
}