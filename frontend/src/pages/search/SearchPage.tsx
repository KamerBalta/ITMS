import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSearchResults, useSearchSuggestions } from '../../hooks/useSearch';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../../lib/recentSearches';

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
                <h1 className="text-3xl font-semibold text-gray-900">Search</h1>
                <p className="text-sm text-gray-500 mt-1">
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
                        className="w-full bg-white border rounded-lg px-5 py-4 text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-200 transition"
                    />
                </form>

                {/* Öneri Açılır Menüsü (Suggestions Dropdown) */}
                {showSuggestionDropdown && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        {suggestions!.map((s) => (
                            <button
                                key={s}
                                onClick={() => handleSelectSuggestion(s)}
                                className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center gap-3 border-b border-gray-50 last:border-0"
                            >
                                <span className="text-gray-400">🔎</span>
                                <span className="font-medium">{s}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Son Aramalar Kartı */}
            {committedQuery.trim().length < 2 && recentSearches.length > 0 && (
                <div className="bg-white border rounded-lg p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-sm text-gray-700">Recent searches</p>
                        <button
                            onClick={handleClearRecent}
                            className="text-xs text-indigo-600 hover:underline font-medium"
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
                                className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-600 transition flex items-center gap-2"
                            >
                                <span>🔎</span>
                                <span>{q}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Arama Sonuçları */}
            {committedQuery.trim().length >= 2 && (
                <>
                    
                    <div className="bg-white border rounded-lg p-1.5 flex gap-2 shadow-xs">
                        {(['tasks', 'projects', 'users'] as TabKey[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === tab
                                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {tab === 'tasks' ? 'Issues' : tab === 'projects' ? 'Projects' : 'Users'} ({tabCounts[tab]})
                            </button>
                        ))}
                    </div>

                    {/* Sonuç Listeleri */}
                    {isFetching ? (
                        <p className="text-sm text-gray-400 p-2">Aranıyor...</p>
                    ) : (
                        <div className="space-y-3">
                            {/* TASKS (ISSUES) */}
                            {activeTab === 'tasks' &&
                                (results?.tasks.length === 0 ? (
                                    <p className="text-sm text-gray-400 p-2">Sonuç bulunamadı.</p>
                                ) : (
                                    results?.tasks.map((t) => (
                                        <Link
                                            key={t.id}
                                            to={`/tasks/${t.id}`}
                                            className="block bg-white border rounded-lg p-5 hover:border-indigo-300 hover:shadow-xs transition"
                                        >
                                            <p className="font-semibold text-indigo-600 text-base">{t.title}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">📁 {t.projectName}</span>
                                                <span>•</span>
                                                <span className="font-medium text-gray-700">{t.status}</span>
                                            </div>
                                        </Link>
                                    ))
                                ))}

                            {/* PROJECTS */}
                            {activeTab === 'projects' &&
                                (results?.projects.length === 0 ? (
                                    <p className="text-sm text-gray-400 p-2">Sonuç bulunamadı.</p>
                                ) : (
                                    results?.projects.map((p) => (
                                        <Link
                                            key={p.id}
                                            to={`/projects/${p.id}`}
                                            className="block bg-white border rounded-lg p-5 hover:border-indigo-300 hover:shadow-xs transition"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-base">{p.name}</p>
                                                    <p className="text-xs text-gray-400 mt-1 font-mono">
                                                        Project key: {p.key}
                                                    </p>
                                                </div>
                                                <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-md border">
                                                    Project
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ))}

                            {/* USERS */}
                            {activeTab === 'users' &&
                                (results?.users.length === 0 ? (
                                    <p className="text-sm text-gray-400 p-2">Sonuç bulunamadı.</p>
                                ) : (
                                    results?.users.map((u) => (
                                        <div
                                            key={u.id}
                                            className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-xs transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200 shrink-0">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
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