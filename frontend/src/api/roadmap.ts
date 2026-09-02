import { apiClient } from './client';
import type { RoadmapData } from '../types/roadmap';

export const roadmapApi = {
    get: (projectId: string) => apiClient.get<RoadmapData>(`/projects/${projectId}/roadmap`).then((res) => res.data),
};