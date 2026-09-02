import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parseCsv } from '../../lib/csvParser';
import { bulkImportApi } from '../../api/bulkImport';
import type { ImportRow, BulkImportResult } from '../../types/bulkImport';
import {
    ArrowLeft,
    Download,
    UploadCloud,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Info,
    Layers,
} from 'lucide-react';

const REQUIRED_HEADERS = ['tempkey', 'issuetypename', 'title'];
const ALL_HEADERS = ['tempkey', 'issuetypename', 'title', 'description', 'priority', 'assigneeemail', 'parenttempkey', 'storypoint'];

export function BulkImportPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [result, setResult] = useState<BulkImportResult | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [fileName, setFileName] = useState('');

    if (!projectId) return null;

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setResult(null);
        setParseError(null);

        try {
            const text = await file.text();
            const rows = parseCsv(text);
            if (rows.length < 2) {
                setParseError('CSV dosyası boş veya geçersiz görünüyor.');
                return;
            }

            const headers = rows[0].map((h) => h.trim().toLowerCase());
            const missingRequired = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
            if (missingRequired.length > 0) {
                setParseError(`Zorunlu sütunlar eksik: ${missingRequired.join(', ')}`);
                return;
            }

            const dataRows = rows.slice(1);
            const parsed: ImportRow[] = dataRows.map((cells) => {
                const get = (name: string) => {
                    const idx = headers.indexOf(name);
                    return idx >= 0 ? cells[idx]?.trim() : undefined;
                };
                return {
                    tempKey: get('tempkey') ?? '',
                    issueTypeName: get('issuetypename') ?? '',
                    title: get('title') ?? '',
                    description: get('description') || undefined,
                    priority: get('priority') || undefined,
                    assigneeEmail: get('assigneeemail') || undefined,
                    parentTempKey: get('parenttempkey') || undefined,
                    storyPoint: get('storypoint') ? Number(get('storypoint')) : undefined,
                };
            });

            setParsedRows(parsed);
        } catch {
            setParseError('CSV dosyası okunurken bir hata oluştu.');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImport = async () => {
        setIsImporting(true);
        setResult(null);
        try {
            const res = await bulkImportApi.import(projectId, parsedRows);
            setResult(res);
        } catch {
            setParseError('İçe aktarma sırasında bir hata oluştu.');
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = [
            ALL_HEADERS.join(','),
            '1,Epic,Ödeme Sistemi Yenileme,,High,,,',
            '2,Story,Kredi kartı entegrasyonu,Yeni ödeme sağlayıcısı entegre edilecek,Medium,ahmet@sirket.com,1,5',
            '3,Sub-task,API dokümantasyonunu incele,,,mehmet@sirket.com,2,',
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gorev-sablonu.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link
                to={`/projects/${projectId}`}
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
                <ArrowLeft className="w-4 h-4" />
                Proje Detayına Dön
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-primary">Toplu Görev İçe Aktarma (CSV)</h1>
                <p className="text-sm text-secondary">
                    Birden fazla görevi tek seferde, <strong>parent-child ilişkisini de koruyarak</strong> içe aktarın.
                </p>
            </div>

            {/* Dosya Yükleme & Şablon Alanı */}
            <div className="surface border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-base">
                        <UploadCloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2>Dosya Seçimi</h2>
                    </div>

                    <button
                        type="button"
                        onClick={downloadTemplate}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold cursor-pointer border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg transition"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Örnek Şablonu İndir (.csv)
                    </button>
                </div>

                {/* Yükleme Kutusu */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-gray-900/30"
                >
                    <FileSpreadsheet className="w-10 h-10 text-muted" />
                    <p className="text-sm font-medium text-primary">
                        {fileName ? fileName : 'CSV dosyasını seçmek için tıklayın'}
                    </p>
                    <p className="text-xs text-muted">Yalnızca .csv uzantılı tablolar desteklenir</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelected}
                        className="hidden"
                    />
                </div>

                {/* Bilgilendirme Kartı */}
                <div className="surface-muted border border-gray-200 dark:border-gray-700 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-secondary">
                    <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p>
                            <strong className="text-primary">Zorunlu sütunlar:</strong> TempKey, IssueTypeName, Title
                        </p>
                        <p>
                            <strong className="text-primary">Opsiyonel sütunlar:</strong> Description, Priority, AssigneeEmail, ParentTempKey, StoryPoint
                        </p>
                        <p className="text-muted">
                            <strong>ParentTempKey</strong>, aynı dosyadaki başka bir satırın TempKey'ine referans verir — böylece Epic → Story → Sub-task hiyerarşisi tek dosyada kurulabilir.
                        </p>
                    </div>
                </div>
            </div>

            {/* Parse Hatası */}
            {parseError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                    <span>{parseError}</span>
                </div>
            )}

            {/* Önizleme Tablosu */}
            {parsedRows.length > 0 && !result && (
                <div className="surface border rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Önizleme ({parsedRows.length} Satır)</span>
                        </div>
                        <span className="text-xs text-muted font-mono">{fileName}</span>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 border-b border-gray-200 dark:border-gray-700">
                                <tr className="text-left text-muted font-semibold">
                                    <th className="py-2 px-3">TempKey</th>
                                    <th className="py-2 px-3">Tip</th>
                                    <th className="py-2 px-3">Başlık</th>
                                    <th className="py-2 px-3">Parent</th>
                                    <th className="py-2 px-3">Öncelik</th>
                                    <th className="py-2 px-3">Puan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {parsedRows.slice(0, 20).map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                                        <td className="py-2 px-3 font-mono text-secondary">{row.tempKey}</td>
                                        <td className="py-2 px-3 text-secondary font-medium">{row.issueTypeName}</td>
                                        <td className="py-2 px-3 text-primary truncate max-w-[200px] font-medium">{row.title}</td>
                                        <td className="py-2 px-3 text-muted font-mono">{row.parentTempKey ?? '-'}</td>
                                        <td className="py-2 px-3 text-secondary">{row.priority ?? '-'}</td>
                                        <td className="py-2 px-3 text-secondary">{row.storyPoint ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {parsedRows.length > 20 && (
                        <p className="text-xs text-muted text-center">+ {parsedRows.length - 20} satır daha mevcut...</p>
                    )}

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={isImporting}
                            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    İçe aktarılıyor...
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4" />
                                    {parsedRows.length} Görevi İçe Aktar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* İçe Aktarma Sonucu */}
            {result && (
                <div className="surface border rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-base border-b border-gray-200 dark:border-gray-700 pb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h2>İçe Aktarma Tamamlandı</h2>
                    </div>

                    <div className="flex items-center gap-3 text-sm font-medium text-primary">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ✓ {result.successCount} görev başarıyla oluşturuldu.
                        </span>
                        {result.failCount > 0 && (
                            <span className="text-red-500 dark:text-red-400 font-bold">
                                · {result.failCount} satır başarısız oldu
                            </span>
                        )}
                    </div>

                    {result.errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Karşılaşılan Hatalar:</p>
                            <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                                {result.errors.map((err, i) => (
                                    <li key={i} className="flex items-start gap-1">
                                        <span>•</span>
                                        <span>TempKey <strong>"{err.tempKey}"</strong>: {err.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="pt-2">
                        <Link
                            to={`/projects/${projectId}`}
                            className="inline-flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            Projeye Dön →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}