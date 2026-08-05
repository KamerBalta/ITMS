import { create } from 'zustand';

type Theme = 'light' | 'dark';
const KEY = 'infera_theme';

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
}

const initialTheme = (localStorage.getItem(KEY) as Theme) || 'light';
applyTheme(initialTheme);

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: initialTheme,
    toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        localStorage.setItem(KEY, next);
        applyTheme(next);
        set({ theme: next });
    },
}));