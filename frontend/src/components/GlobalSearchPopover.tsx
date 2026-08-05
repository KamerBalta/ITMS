import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSearchResults, useSearchSuggestions } from '../hooks/useSearch';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../lib/recentSearches';
import { Search, Clock, CheckSquare, FolderKanban, User, X } from 'lucide-react';

type TabKey = 'tasks' | 'projects' | 'users';

interface GlobalSearchPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
}

export function GlobalSearchPopover({ isOpen, onClose }: GlobalSearchPopoverProps) {
    const [query, setQuery] = useState('');
    const [committedQuery, setCommittedQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('tasks');

    const { data: results, isFetching } = useSearchResults(committedQuery);
    const { data: suggestions } = useSearchSuggestions(query);
    const [recentSearches, setRecentSearches] = useState(getRecentSearches());

    const popoverRef = useRef<HTMLDivElement>(null);

    // Dışarı tıklanınca popover'ı kapat
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Yazı değiştikçe canlı arama için commit et
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                setCommittedQuery(query.trim());
                addRecentSearch(query.trim());
                setRecentSearches(getRecentSearches());
            } else {
                setCommittedQuery('');
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    const tabCounts = {
        tasks: results?.tasks.length ?? 0,
        projects: results?.projects.length ?? 0,
        users: results?.users.length ?? 0,
    };

    const handleClearRecent = () => {
        clearRecentSearches();
        setRecentSearches([]);
    };

    return (
        <div
            ref={popoverRef}
            className="absolute left-0 top-full mt-2 w-[480px] sm:w-[580px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150"
        >
            {/* Popover İç Arama Girişi */}
            <div className="p-3 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/50">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Search issues, projects, users..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent border-none text-sm text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
                {query && (
                    <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Arama Yapılmamışsa: Son Aramalar veya Öneriler */}
            {committedQuery.trim().length < 2 && (
                <div className="p-4 max-h-[380px] overflow-y-auto space-y-4">
                    {/* Anlık Öneriler (Arama Yapılırken) */}
                    {query.trim().length >= 2 && suggestions && suggestions.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">Öneriler</p>
                            {suggestions.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setQuery(s)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition flex items-center gap-2"
                                >
                                    <Search className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{s}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Son Aramalar */}
                    {recentSearches.length > 0 ? (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between px-2 pb-1">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Son Aramalar</span>
                                <button onClick={handleClearRecent} className="text-[11px] text-blue-600 hover:underline font-medium">
                                    Temizle
                                </button>
                            </div>
                            {recentSearches.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setQuery(q)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition flex items-center gap-2"
                                >
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{q}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-400 text-xs">
                            Aramak istediğiniz görevi veya projeyi yazın...
                        </div>
                    )}
                </div>
            )}

            {/* Arama Sonuçları */}
            {committedQuery.trim().length >= 2 && (
                <div className="p-3 space-y-3">
                    {/* Sekmeler (Tabs) */}
                    <div className="flex gap-1 border-b border-slate-100 pb-2">
                        {(['tasks', 'projects', 'users'] as TabKey[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === tab
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {tab === 'tasks' ? 'Issues' : tab === 'projects' ? 'Projects' : 'Users'} ({tabCounts[tab]})
                            </button>
                        ))}
                    </div>

                    {/* Liste Sonuçları */}
                    <div className="max-h-[320px] overflow-y-auto space-y-1">
                        {isFetching ? (
                            <p className="text-xs text-slate-400 p-2">Aranıyor...</p>
                        ) : activeTab === 'tasks' ? (
                            results?.tasks.length === 0 ? (
                                <p className="text-xs text-slate-400 p-2">Görev bulunamadı.</p>
                            ) : (
                                results?.tasks.map((t) => (
                                    <Link
                                        key={t.id}
                                        to={`/tasks/${t.id}`}
                                        onClick={onClose}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                                            <span className="text-xs font-semibold text-slate-800 truncate">{t.title}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">
                                            {t.projectName}
                                        </span>
                                    </Link>
                                ))
                            )
                        ) : activeTab === 'projects' ? (
                            results?.projects.length === 0 ? (
                                <p className="text-xs text-slate-400 p-2">Proje bulunamadı.</p>
                            ) : (
                                results?.projects.map((p) => (
                                    <Link
                                        key={p.id}
                                        to={`/projects/${p.id}`}
                                        onClick={onClose}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
                                            <span className="text-xs font-semibold text-slate-800 truncate">{p.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">KEY: {p.key}</span>
                                    </Link>
                                ))
                            )
                        ) : results?.users.length === 0 ? (
                            <p className="text-xs text-slate-400 p-2">Kullanıcı bulunamadı.</p>
                        ) : (
                            results?.users.map((u) => (
                                <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                        <User className="w-3 h-3" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}