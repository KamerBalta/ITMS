import { useState } from 'react';
import { useTaskCustomFieldValues, useSetTaskCustomFieldValue } from '../../../hooks/useCustomFields';
import { useCustomFields } from '../../../hooks/useCustomFields';
import { useProjectMembers } from '../../../hooks/useProjectMembers';

function parseOptions(optionsJson: string | null | undefined): string[] {
    if (!optionsJson) return [];
    try {
        return JSON.parse(optionsJson);
    } catch {
        return [];
    }
}

export function CustomFieldsSection({ taskId, projectId }: { taskId: string; projectId: string }) {
    const { data: values } = useTaskCustomFieldValues(taskId);
    const { data: definitions } = useCustomFields(projectId); // optionsJson icin tam tanima ihtiyac var
    const { data: members } = useProjectMembers(projectId);
    const setValue = useSetTaskCustomFieldValue(taskId);
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    if (!values || values.length === 0) return null;

    const getValue = (fieldId: string, current: string | null) => drafts[fieldId] ?? current ?? '';
    const getOptions = (fieldId: string) => parseOptions(definitions?.find((d) => d.id === fieldId)?.optionsJson);

    const handleBlur = (fieldId: string, value: string) => {
        setValue.mutate({ fieldId, value: value || null });
    };

    return (
        <div className="surface border rounded-lg p-4">
            <h2 className="font-semibold text-primary mb-3">Özel Alanlar</h2>
            <div className="grid grid-cols-2 gap-3">
                {values.map((f) => (
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
                                {getOptions(f.fieldId).map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
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
                                    <option key={m.userId} value={m.userId}>{m.userName}</option>
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