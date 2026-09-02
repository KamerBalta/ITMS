import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
const KEY = 'infera_theme';

function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function applyTheme(theme: Theme) {
    const actualTheme = theme === 'system' ? getSystemTheme() : theme;

    document.documentElement.classList.toggle('dark', actualTheme === 'dark');
}

const savedTheme = localStorage.getItem(KEY);

const initialTheme: Theme =
    savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
        ? savedTheme
        : 'light';

applyTheme(initialTheme);

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: initialTheme,

    setTheme: (theme) => {
        localStorage.setItem(KEY, theme);
        applyTheme(theme);
        set({ theme });
    },

    toggleTheme: () => {
        const current = get().theme;

        const next: Theme =
            current === 'light'
                ? 'dark'
                : current === 'dark'
                    ? 'light'
                    : 'dark';

        localStorage.setItem(KEY, next);
        applyTheme(next);
        set({ theme: next });
    },
}));