import { useState } from 'react';
import { useAllChangelog, useCreateChangelogEntry } from '../../hooks/useChangelog';

export function ChangelogManagementPage() {
    const { data: entries, isLoading } = useAllChangelog();
    const createEntry = useCreateChangelogEntry();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Feature');

    const handleCreate = async () => {
        if (!title.trim() || !description.trim()) return;
        await createEntry.mutateAsync({ title, description, category });
        setTitle(''); setDescription('');
    };

    return (
        <div className="max-w-2xl space-y-4">
            <h1 className="text-2xl font-bold text-primary">Değişiklik Günlüğü</h1>
            <p className="text-sm text-muted">
                Buraya eklediğiniz her girdi, henüz görmemiş tüm kullanıcılara bir sonraki girişlerinde otomatik gösterilir.
            </p>

            <div className="surface border rounded-lg p-4 space-y-2">
                <input type="text" placeholder="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm" />
                <textarea placeholder="Açıklama" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full input-base border rounded px-3 py-2 text-sm" />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full input-base border rounded px-3 py-2 text-sm">
                    <option value="Feature">Yeni Özellik</option>
                    <option value="Improvement">İyileştirme</option>
                    <option value="Fix">Düzeltme</option>
                    <option value="BreakingChange">Önemli Değişiklik</option>
                </select>
                <button onClick={handleCreate} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">Yayınla</button>
            </div>

            {isLoading ? (
                <p className="text-muted">Yükleniyor...</p>
            ) : (
                <div className="surface border rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    {entries?.map((e) => (
                        <div key={e.id} className="p-3">
                            <p className="text-sm font-medium text-primary">{e.title}</p>
                            <p className="text-xs text-secondary">{e.description}</p>
                            <p className="text-[10px] text-muted mt-1">{new Date(e.publishedAt).toLocaleString('tr-TR')}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}