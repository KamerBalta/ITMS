import { apiClient } from './client';
import type { RoadmapEpic } from '../types/roadmap';

export const roadmapApi = {
    get: (projectId: string) => apiClient.get<RoadmapEpic[]>(`/projects/${projectId}/roadmap`).then((res) => res.data),
};