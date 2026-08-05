import { useState } from 'react';
import { useComments, useAddComment, useUpdateComment, useDeleteComment } from '../../../hooks/useTaskDetail';
import { useProjectMembers } from '../../../hooks/useProjectMembers';
import { MentionTextarea } from '../../../components/MentionTextarea';
import { renderMentions } from '../../../lib/renderMentions';

export function CommentsSection({ taskId, projectId }: { taskId: string; projectId: string }) {
    const { data: comments } = useComments(taskId);
    const { data: members } = useProjectMembers(projectId);
    const addComment = useAddComment(taskId);
    const updateComment = useUpdateComment(taskId);
    const deleteComment = useDeleteComment(taskId);

    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        await addComment.mutateAsync(newComment);
        setNewComment('');
    };

    const startEditing = (id: string, content: string) => {
        setEditingId(id);
        setEditingText(content);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        await updateComment.mutateAsync({ commentId: editingId, content: editingText });
        setEditingId(null);
    };

    return (
        <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Yorumlar</h2>

            <div className="space-y-3 mb-4">
                {comments?.map((c) => (
                    <div key={c.id} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{c.userName}</span>
                            <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString('tr-TR')}</span>
                        </div>

                        {editingId === c.id ? (
                            <div className="mt-1 space-y-1">
                                <MentionTextarea
                                    value={editingText}
                                    onChange={setEditingText}
                                    members={members ?? []}
                                    rows={2}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleSaveEdit} className="text-xs text-indigo-600 hover:underline">
                                        Kaydet
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">
                                        İptal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{renderMentions(c.content)}</p>
                                {c.isOwner && (
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            onClick={() => startEditing(c.id, c.content)}
                                            className="text-xs text-gray-400 hover:text-indigo-600"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => deleteComment.mutate(c.id)}
                                            className="text-xs text-gray-400 hover:text-red-600"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
                {(!comments || comments.length === 0) && <p className="text-sm text-gray-400">Henüz yorum yok.</p>}
            </div>

            <form onSubmit={handleAdd} className="space-y-2">
                <MentionTextarea
                    value={newComment}
                    onChange={setNewComment}
                    members={members ?? []}
                    placeholder="Yorum yaz... (@ ile birini etiketleyebilirsin)"
                    rows={2}
                />
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 font-medium transition"
                >
                    Gönder
                </button>
            </form>
        </div>
    );
}