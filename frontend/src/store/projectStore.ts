import { create } from 'zustand';

interface ProjectState {
    selectedProjectId: string | null;
    setSelectedProjectId: (id: string) => void;
    clearSelectedProject: () => void;
}

const SELECTED_PROJECT_KEY = 'infera_selected_project';

export const useProjectStore = create<ProjectState>((set) => ({
    selectedProjectId: localStorage.getItem(SELECTED_PROJECT_KEY),

    setSelectedProjectId: (id) => {
        localStorage.setItem(SELECTED_PROJECT_KEY, id);
        set({ selectedProjectId: id });
    },

    clearSelectedProject: () => {
        localStorage.removeItem(SELECTED_PROJECT_KEY);
        set({ selectedProjectId: null });
    },
}));