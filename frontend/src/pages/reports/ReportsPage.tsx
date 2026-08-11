import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useSprints } from '../../hooks/useSprints';
import { apiClient } from '../../api/client';
import { FileSpreadsheet, Layers, ShieldCheck, Download, Loader2 } from 'lucide-react';

async function downloadBlob(url: string, fileName: string) {
    const res = await apiClient.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
}

export function ReportsPage() {
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.roles.includes('System Admin') ?? false;
    const { data: sprints } = useSprints(selectedProjectId);

    const [selectedSprintId, setSelectedSprintId] = useState('');
    const [downloading, setDownloading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!selectedProjectId) {
        return (
            <div className="surface border rounded-xl p-8 text-center text-secondary text-sm">
                Devam etmek için üstten bir proje seçin.
            </div>
        );
    }

    const handleDownload = async (key: string, url: string, fileName: string) => {
        setDownloading(key);
        setError(null);
        try {
            await downloadBlob(url, fileName);
        } catch {
            setError('Rapor indirilemedi.');
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="max-w-6xl w-full space-y-6 px-2 sm:px-0">
            {/* Üst Başlık ve Açıklama */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <h1 className="text-3xl font-semibold text-primary">Reports</h1>
                <p className="text-sm text-secondary mt-1">
                    Sprint ve proje raporlarını görüntüleyin veya dışa aktarın.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-sm p-3.5 rounded-xl font-medium">
                    {error}
                </div>
            )}

            {/* Yan Yana Rapor Kartları (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {/* 📊 Sprint Report */}
                <div className="surface rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-primary text-lg">Sprint Report</h2>
                            <p className="text-xs text-secondary mt-1 leading-relaxed">
                                Seçilen sprint'teki tüm görevlerin detaylı listesi.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <select
                            value={selectedSprintId}
                            onChange={(e) => setSelectedSprintId(e.target.value)}
                            className="w-full input-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            <option value="">Sprint seçin...</option>
                            {sprints?.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.status})
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() =>
                                handleDownload(
                                    'sprint',
                                    `/reports/export/sprint/${selectedSprintId}`,
                                    `sprint-raporu-${selectedSprintId}.xlsx`
                                )
                            }
                            disabled={!selectedSprintId || downloading === 'sprint'}
                            className="w-full bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                            {downloading === 'sprint' ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-3.5 h-3.5" />
                                    Export Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 📋 Backlog Report */}
                <div className="surface rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-primary text-lg">Backlog Report</h2>
                            <p className="text-xs text-secondary mt-1 leading-relaxed">
                                Sprint'e alınmamış tüm görevlerin listesi.
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() =>
                                handleDownload(
                                    'backlog',
                                    `/reports/export/backlog/${selectedProjectId}`,
                                    `backlog-${selectedProjectId}.xlsx`
                                )
                            }
                            disabled={downloading === 'backlog'}
                            className="w-full bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {downloading === 'backlog' ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-3.5 h-3.5" />
                                    Export Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 🛡 Audit Log Report */}
                {isAdmin && (
                    <div className="surface rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-primary text-lg">Audit Log Report</h2>
                                <p className="text-xs text-secondary mt-1 leading-relaxed">
                                    Sistem genelindeki tüm işlem kayıtları (yalnızca Admin).
                                </p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => handleDownload('audit', '/audit-logs/export', 'audit-loglari.xlsx')}
                                disabled={downloading === 'audit'}
                                className="w-full bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {downloading === 'audit' ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-3.5 h-3.5" />
                                        Export Excel
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}