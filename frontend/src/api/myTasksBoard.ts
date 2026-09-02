import { apiClient } from './client';
import type { MyTaskBoardItem } from '../types/myTasksBoard';

export const myTasksBoardApi = {
    get: () => apiClient.get<MyTaskBoardItem[]>('/tasks/my-board').then((res) => res.data),
};