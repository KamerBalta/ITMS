import { useState } from 'react';
import { useTaskCustomFieldValues, useSetTaskCustomFieldValue } from '../../../hooks/useCustomFields';
import { useProjectMembers } from '../../../hooks/useProjectMembers';

export function CustomFieldsSection({ taskId, projectId }: { taskId: string; projectId: string }) {
    const { data: fields } = useTaskCustomFieldValues(taskId);
    const { data: members } = useProjectMembers(projectId);
    const setValue = useSetTaskCustomFieldValue(taskId);
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    if (!fields || fields.length === 0) return null;

    const getValue = (fieldId: string, current: string | null) => drafts[fieldId] ?? current ?? '';

    const handleBlur = (fieldId: string, value: string) => {
        setValue.mutate({ fieldId, value: value || null });
    };

    return (
        <div className="surface border rounded-lg p-4">
            <h2 className="font-semibold mb-3 text-primary">Özel Alanlar</h2>
            <div className="grid grid-cols-2 gap-3">
                {fields.map((f) => (
                    <div key={f.fieldId}>
                        <label className="text-xs text-muted">
                            {f.name}
                            {f.value === null && <span className="text-red-400"> *</span>}
                        </label>
                        {f.fieldType === 'select' ? (
                            <select
                                value={getValue(f.fieldId, f.value)}
                                onChange={(e) => {
                                    setDrafts((prev) => ({ ...prev, [f.fieldId]: e.target.value }));
                                    handleBlur(f.fieldId, e.target.value);
                                }}
                                className="w-full input-base border rounded px-2 py-1.5 text-sm mt-1"
                            >
                                <option value="">-</option>
                                {/* select tipi icin optionsJson backend'den ayrica gelmiyor bu DTO'da -- MVP icin
                    kullanicinin serbest deger girmesine izin veriyoruz, ileride optionsJson eklenebilir */}
                            </select>
                        ) : f.fieldType === 'user' ? (
                            <select
                                value={getValue(f.fieldId, f.value)}
                                onChange={(e) => {
                                    setDrafts((prev) => ({ ...prev, [f.fieldId]: e.target.value }));
                                    handleBlur(f.fieldId, e.target.value);
                                }}
                                className="w-full input-base border rounded px-2 py-1.5 text-sm mt-1"
                            >
                                <option value="">-</option>
                                {members?.map((m) => (
                                    <option key={m.userId} value={m.userId}>
                                        {m.userName}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={f.fieldType === 'number' ? 'number' : 'text'}
                                value={getValue(f.fieldId, f.value)}
                                onChange={(e) => setDrafts((prev) => ({ ...prev, [f.fieldId]: e.target.value }))}
                                onBlur={(e) => handleBlur(f.fieldId, e.target.value)}
                                className="w-full input-base border rounded px-2 py-1.5 text-sm mt-1"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}