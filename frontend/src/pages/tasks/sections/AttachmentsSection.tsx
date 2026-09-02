import { useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../../types/api';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../../../hooks/useTaskDetail';
import { attachmentsApi } from '../../../api/taskDetail';
import { SkeletonBlock } from '../../../components/Skeleton';

function formatSize(bytes: number | null) {
    if (!bytes) return '';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}

export function AttachmentsSection({ taskId }: { taskId: string }) {
    const { data: attachments, isLoading: attachmentsLoading } = useAttachments(taskId);
    const upload = useUploadAttachment(taskId);
    const deleteAttachment = useDeleteAttachment(taskId);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const doUpload = async (file: File) => {
        setUploadError(null);
        try {
            await upload.mutateAsync(file);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setUploadError(
                axiosError.response?.data?.message ??
                'Dosya yüklenemedi (izin verilmeyen uzantı, bozuk içerik veya 25MB sınırı aşılmış olabilir).'
            );
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await doUpload(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await doUpload(file);
    };

    const handleDownload = async (attachmentId: string) => {
        setDownloadingId(attachmentId);
        try {
            await attachmentsApi.download(taskId, attachmentId);
        } catch {
            alert('Dosya indirilemedi.');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="surface border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-primary">Dosyalar</h2>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                    + Dosya Yükle
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileSelected} className="hidden" />
            </div>

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 mb-3 text-center transition-colors ${isDragOver
                        ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
            >
                <p className="text-xs text-muted">Dosyayı buraya sürükleyip bırakın</p>
            </div>

            {uploadError && <p className="text-xs text-red-500 dark:text-red-400 mb-2">{uploadError}</p>}

            {attachmentsLoading ? (
                <div className="space-y-2">
                    <SkeletonBlock className="h-10 w-full rounded" />
                    <SkeletonBlock className="h-10 w-full rounded" />
                </div>
            ) : !attachments || attachments.length === 0 ? (
                <p className="text-sm text-muted">Henüz dosya yok.</p>
            ) : (
                <ul className="space-y-2">
                    {attachments.map((a) => (
                        <li
                            key={a.id}
                            className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm surface-muted"
                        >
                            <button
                                onClick={() => handleDownload(a.id)}
                                disabled={downloadingId === a.id}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 cursor-pointer"
                            >
                                📎 {a.fileName} {downloadingId === a.id && '(indiriliyor...)'}
                            </button>
                            <div className="flex items-center gap-3 text-xs text-muted">
                                <span>{formatSize(a.fileSize)}</span>
                                <span className="text-secondary">{a.uploadedByName}</span>
                                <button
                                    onClick={() => deleteAttachment.mutate(a.id)}
                                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer"
                                >
                                    Sil
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}