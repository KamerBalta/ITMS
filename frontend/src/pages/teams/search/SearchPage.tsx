import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSearchResults, useSearchSuggestions } from "../../../hooks/useSearch";
import {
    getRecentSearches,
    addRecentSearch,
    clearRecentSearches,
} from "../../../lib/recentSearches";

type TabKey = 'tasks' | 'projects' | 'users';

export function SearchPage() {
    const [query, setQuery] = useState('');
    const [committedQuery, setCommittedQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('tasks');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const { data: results, isFetching } = useSearchResults(committedQuery);
    const { data: suggestions } = useSearchSuggestions(query);
    const [recentSearches, setRecentSearches] = useState(getRecentSearches());

    const inputWrapperRef = useRef<HTMLDivElement>(null);

    // Dışarıya tıklanınca öneri listesini kapat
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const commitSearch = (q: string) => {
        if (q.trim().length < 2) return;
        setCommittedQuery(q);
        setShowSuggestions(false);
        addRecentSearch(q.trim());
        setRecentSearches(getRecentSearches());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        commitSearch(query);
    };

    const handleSelectSuggestion = (suggestion: string) => {
        setQuery(suggestion);
        commitSearch(suggestion);
    };

    const handleClearRecent = () => {
        clearRecentSearches();
        setRecentSearches([]);
    };

    const tabCounts = {
        tasks: results?.tasks.length ?? 0,
        projects: results?.projects.length ?? 0,
        users: results?.users.length ?? 0,
    };

    const showSuggestionDropdown = showSuggestions && query.trim().length >= 2 && suggestions && suggestions.length > 0;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-semibold text-primary">Search</h1>
                <p className="text-sm text-secondary mt-1">
                    Görev, proje ve kullanıcılar arasında arama yapın.
                </p>
            </div>

            {/* Search Input & Dynamic Suggestions Bar */}
            <div ref={inputWrapperRef} className="relative">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Search issues, projects and users..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        autoFocus
                        className="w-full input-base border border-gray-200 dark:border-gray-700 rounded-lg px-5 py-4 text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </form>

                {/* Öneri Açılır Menüsü (Suggestions Dropdown) */}
                {showSuggestionDropdown && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        {suggestions!.map((s) => (
                            <button
                                key={s}
                                onClick={() => handleSelectSuggestion(s)}
                                className="w-full text-left px-5 py-3 text-sm text-secondary hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer"
                            >
                                <span className="text-muted">🔎</span>
                                <span className="font-medium text-primary">{s}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Son Aramalar Kartı */}
            {committedQuery.trim().length < 2 && recentSearches.length > 0 && (
                <div className="surface border rounded-lg p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-sm text-primary">Recent searches</p>
                        <button
                            onClick={handleClearRecent}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="space-y-1">
                        {recentSearches.map((q) => (
                            <button
                                key={q}
                                onClick={() => {
                                    setQuery(q);
                                    commitSearch(q);
                                }}
                                className="block w-full text-left px-3 py-2 rounded-md hover-surface text-sm text-secondary transition flex items-center gap-2 cursor-pointer"
                            >
                                <span className="text-muted">🔎</span>
                                <span>{q}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Arama Sonuçları */}
            {committedQuery.trim().length >= 2 && (
                <>
                    <div className="surface border rounded-lg p-1.5 flex gap-2 shadow-xs">
                        {(['tasks', 'projects', 'users'] as TabKey[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${activeTab === tab
                                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800'
                                        : 'text-muted hover-surface hover:text-primary'
                                    }`}
                            >
                                {tab === 'tasks' ? 'Issues' : tab === 'projects' ? 'Projects' : 'Users'} ({tabCounts[tab]})
                            </button>
                        ))}
                    </div>

                    {/* Sonuç Listeleri */}
                    {isFetching ? (
                        <p className="text-sm text-muted p-2">Aranıyor...</p>
                    ) : (
                        <div className="space-y-3">
                            {/* TASKS (ISSUES) */}
                            {activeTab === 'tasks' &&
                                (results?.tasks.length === 0 ? (
                                    <p className="text-sm text-muted p-2">Sonuç bulunamadı.</p>
                                ) : (
                                    results?.tasks.map((t) => (
                                        <Link
                                            key={t.id}
                                            to={`/tasks/${t.id}`}
                                            className="block surface border rounded-lg p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition"
                                        >
                                            {t.issueKey && (
                                                <p className="text-xs text-muted font-mono mb-1">{t.issueKey}</p>
                                            )}
                                            <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.title}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                                                <span className="flex items-center gap-1">📁 {t.projectName}</span>
                                                <span>•</span>
                                                <span className="font-medium text-secondary">{t.status}</span>
                                            </div>
                                        </Link>
                                    ))
                                ))}

                            {/* PROJECTS */}
                            {activeTab === 'projects' &&
                                (results?.projects.length === 0 ? (
                                    <p className="text-sm text-muted p-2">Sonuç bulunamadı.</p>
                                ) : (
                                    results?.projects.map((p) => (
                                        <Link
                                            key={p.id}
                                            to={`/projects/${p.id}`}
                                            className="block surface border rounded-lg p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-primary text-base">{p.name}</p>
                                                    <p className="text-xs text-muted mt-1 font-mono">
                                                        Project key: {p.key}
                                                    </p>
                                                </div>
                                                <span className="text-xs surface-muted text-secondary font-medium px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                                                    Project
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ))}

                            {/* USERS */}
                            {activeTab === 'users' &&
                                (results?.users.length === 0 ? (
                                    <p className="text-sm text-muted p-2">Sonuç bulunamadı.</p>
                                ) : (
                                    results?.users.map((u) => (
                                        <div
                                            key={u.id}
                                            className="surface border rounded-lg p-4 flex items-center justify-between hover:shadow-xs transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-800 shrink-0">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-primary text-sm">{u.name}</p>
                                                    <p className="text-xs text-muted mt-0.5">{u.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}