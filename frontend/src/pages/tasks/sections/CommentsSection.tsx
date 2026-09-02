import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useComments, useAddComment, useUpdateComment, useDeleteComment } from '../../../hooks/useTaskDetail';
import { useProjectMembers } from '../../../hooks/useProjectMembers';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { MarkdownContent } from '../../../components/MarkdownContent';
import { Avatar } from '../../../components/Avatar';
import { SkeletonBlock } from '../../../components/Skeleton';

export function CommentsSection({ taskId, projectId }: { taskId: string; projectId: string }) {
    const { data: comments, isLoading: commentsLoading } = useComments(taskId);
    const { data: members } = useProjectMembers(projectId);
    const addComment = useAddComment(taskId);
    const updateComment = useUpdateComment(taskId);
    const deleteComment = useDeleteComment(taskId);
    const [searchParams] = useSearchParams();
    const highlightedCommentId = searchParams.get('commentId');
    const highlightRef = useRef<HTMLDivElement>(null);

    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    useEffect(() => {
        if (highlightedCommentId && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightedCommentId, comments]);

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
        <div className="surface border rounded-lg p-4" id="comments">
            <h2 className="font-semibold mb-3 text-primary">Yorumlar</h2>

            {commentsLoading ? (
                <SkeletonBlock className="h-20 w-full mb-4" />
            ) : (
                <div className="space-y-3 mb-4">
                    {comments?.map((c) => (
                        <div
                            key={c.id}
                            ref={c.id === highlightedCommentId ? highlightRef : undefined}
                            className={`border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0 rounded transition-colors ${c.id === highlightedCommentId
                                    ? 'bg-yellow-50 dark:bg-yellow-950 ring-1 ring-yellow-200 dark:ring-yellow-800 p-2'
                                    : ''
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Avatar userId={c.userId} name={c.userName} size="xs" />
                                <span className="text-sm font-medium text-primary">{c.userName}</span>
                                <span className="text-xs text-muted ml-auto">
                                    {new Date(c.createdAt).toLocaleString('tr-TR')}
                                </span>
                            </div>

                            {editingId === c.id ? (
                                <div className="mt-1 space-y-1">
                                    <RichTextEditor
                                        value={editingText}
                                        onChange={setEditingText}
                                        members={members}
                                        rows={3}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                        >
                                            Kaydet
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-xs text-muted hover:underline cursor-pointer"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-1 text-secondary">
                                        <MarkdownContent content={c.content} />
                                    </div>
                                    {c.isOwner && (
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => startEditing(c.id, c.content)}
                                                className="text-xs text-muted hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => deleteComment.mutate(c.id)}
                                                className="text-xs text-muted hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                    {(!comments || comments.length === 0) && (
                        <p className="text-sm text-muted">Henüz yorum yok.</p>
                    )}
                </div>
            )}

            <form onSubmit={handleAdd} className="space-y-2">
                <RichTextEditor
                    value={newComment}
                    onChange={setNewComment}
                    members={members}
                    placeholder="Yorum yaz... (@ ile birini etiketleyebilirsin, Markdown desteklenir)"
                    rows={3}
                />
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                    Gönder
                </button>
            </form>
        </div>
    );
}