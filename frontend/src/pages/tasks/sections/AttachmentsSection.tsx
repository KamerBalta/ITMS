import { useRef } from 'react';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../../../hooks/useTaskDetail';
import { attachmentsApi } from '../../../api/taskDetail';

function formatSize(bytes: number | null) {
    if (!bytes) return '';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}

export function AttachmentsSection({ taskId }: { taskId: string }) {
    const { data: attachments } = useAttachments(taskId);
    const upload = useUploadAttachment(taskId);
    const deleteAttachment = useDeleteAttachment(taskId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await upload.mutateAsync(file);
        } catch {
            alert('Dosya yüklenemedi (izin verilmeyen uzantı veya 25MB sınırı aşılmış olabilir).');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Dosyalar</h2>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-indigo-600 hover:underline"
                >
                    + Dosya Yükle
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileSelected} className="hidden" />
            </div>

            {!attachments || attachments.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz dosya yok.</p>
            ) : (
                <ul className="space-y-2">
                    {attachments.map((a) => (
                        <li key={a.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                            <a
                                href={attachmentsApi.downloadUrl(taskId, a.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline"
                            >
                                📎 {a.fileName}
                            </a>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{formatSize(a.fileSize)}</span>
                                <span>{a.uploadedByName}</span>
                                <button onClick={() => deleteAttachment.mutate(a.id)} className="text-red-400 hover:text-red-600">
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