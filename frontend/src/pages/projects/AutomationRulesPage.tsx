import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    useAutomationRules,
    useCreateAutomationRule,
    useToggleAutomationRule,
    useDeleteAutomationRule,
} from '../../hooks/useAutomation';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useProjectIssueTypes } from '../../hooks/useProjectIssueTypes';
import { useCanManageProject } from '../../hooks/useCanManageProject';

const STATUS_OPTIONS = ['ToDo', 'InProgress', 'ReadyForReview', 'ReadyForQA', 'Done', 'Closed'];

export function AutomationRulesPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const canManage = useCanManageProject(projectId ?? null);

    const { data: rules, isLoading, isError } = useAutomationRules(projectId ?? null);
    const { data: members } = useProjectMembers(projectId ?? null);
    const { data: issueTypes } = useProjectIssueTypes(projectId ?? null);
    const createRule = useCreateAutomationRule(projectId!);
    const toggleRule = useToggleAutomationRule(projectId!);
    const deleteRule = useDeleteAutomationRule(projectId!);

    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState('TaskCreated');
    const [triggerIssueType, setTriggerIssueType] = useState('');
    const [triggerStatus, setTriggerStatus] = useState('Done');
    const [actionType, setActionType] = useState('NotifyUser');
    const [actionUserId, setActionUserId] = useState('');

    if (!projectId) return null;

    const handleCreate = async () => {
        if (!name.trim()) return;

        if (
            (actionType === 'NotifyUser' ||
                actionType === 'AssignToUser') &&
            !actionUserId
        ) {
            return;
        }

        const conditionJson =
            triggerType === 'TaskCreated' && triggerIssueType
                ? JSON.stringify({ issueTypeName: issueTypes?.find((t) => t.issueTypeId === triggerIssueType)?.name })
                : triggerType === 'StatusChangedTo'
                    ? JSON.stringify({ status: triggerStatus })
                    : undefined;

        const actionParams =
            actionType === 'AssignToUser' || actionType === 'NotifyUser'
                ? JSON.stringify({ userId: actionUserId })
                : '{}';

        await createRule.mutateAsync({
            name: name.trim(),
            triggerType,
            triggerConditionJson: conditionJson,
            actionType,
            actionParamsJson: actionParams,
        });
        setName('');
        setTriggerIssueType('');
        setActionUserId('');
    };

    return (
        <div className="max-w-4xl space-y-6 p-6">
            <div>
                <Link
                    to={`/projects/${projectId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition"
                >
                    ← Proje / Proje Ayarları
                </Link>

                <div className="mt-4">
                    <h1 className="text-xl font-semibold text-primary">
                        Otomasyon Kuralları
                    </h1>

                    <p className="mt-1 text-sm text-secondary">
                        Projede belirli olaylar gerçekleştiğinde otomatik eylemler gerçekleştirin.
                    </p>
                </div>
            </div>

            {isError ? (
                <div className="surface border border-red-200 dark:border-red-900/60 rounded-lg p-8 text-center bg-red-50/50 dark:bg-red-950/20">
                    <p className="text-sm font-medium text-red-500">
                        Bu sayfayı görüntüleme yetkiniz yok veya bir hata oluştu.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="surface border rounded-lg p-8 text-center">
                    <p className="text-sm text-secondary">Yükleniyor...</p>
                </div>
            ) : (
                <div className="surface overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 bg-surface-muted px-5 py-4 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-primary">
                                    Otomasyon Kuralları
                                </h2>

                                <p className="mt-1 text-xs text-secondary">
                                    Projenizde çalışan otomasyonları yönetin.
                                </p>
                            </div>

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-secondary dark:bg-gray-800">
                                {rules?.length ?? 0} kural
                            </span>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {rules?.map((r) => (
                            <div
                                key={r.id}
                                className={`group px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-900/50 ${!r.isActive ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                        ⚡
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-primary">
                                                {r.name}
                                            </span>

                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.isActive
                                                    ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}
                                            >
                                                {r.isActive ? 'Etkin' : 'Devre dışı'}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-center gap-2 text-xs text-secondary flex-wrap">
                                            <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                                                {r.triggerType === 'TaskCreated'
                                                    ? 'Görev oluşturulunca'
                                                    : r.triggerType === 'StatusChangedTo'
                                                        ? 'Durum şuna değişince'
                                                        : r.triggerType === 'TaskAssigned'
                                                            ? 'Görev birine atanınca'
                                                            : r.triggerType === 'CommentAdded'
                                                                ? 'Yorum eklenince'
                                                                : r.triggerType}
                                            </span>

                                            <span className="text-muted">→</span>

                                            <span className="rounded-md bg-indigo-50 px-2 py-1 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                {r.actionType === 'NotifyUser'
                                                    ? 'Bildirim gönder'
                                                    : 'Kullanıcıya ata'}
                                            </span>
                                        </div>
                                    </div>

                                    {canManage && (
                                        <div className="flex shrink-0 items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleRule.mutate(r.id)}
                                                disabled={toggleRule.isPending}
                                                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 cursor-pointer ${r.isActive
                                                    ? 'border-gray-200 text-secondary hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
                                                    : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40'
                                                    }`}
                                            >
                                                {r.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => deleteRule.mutate(r.id)}
                                                disabled={deleteRule.isPending}
                                                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 disabled:opacity-50 cursor-pointer"
                                            >
                                                {deleteRule.isPending ? 'Siliniyor...' : 'Sil'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {rules?.length === 0 && (
                            <div className="px-5 py-12 text-center">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg dark:bg-gray-800">
                                    ⚡
                                </div>

                                <p className="mt-3 text-sm font-medium text-primary">
                                    Henüz otomasyon kuralı yok
                                </p>

                                <p className="mt-1 text-xs text-secondary">
                                    {canManage
                                        ? 'Aşağıdaki formu kullanarak ilk otomasyon kuralınızı oluşturabilirsiniz.'
                                        : 'Bu projede tanımlı otomasyon kuralı bulunmamaktadır.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!isError && canManage && (
                <div className="surface overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 bg-surface-muted px-5 py-4 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-primary">
                            Yeni Otomasyon Kuralı
                        </h2>

                        <p className="mt-1 text-xs text-secondary">
                            Bir olay gerçekleştiğinde hangi eylemin otomatik olarak yapılacağını belirleyin.
                        </p>
                    </div>

                    <div className="space-y-5 p-5">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">
                                Kural adı
                            </label>

                            <input
                                type="text"
                                placeholder="Örn. Done olduğunda yöneticiyi bilgilendir"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-base w-full rounded-lg border px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">
                                Tetikleyici
                            </label>

                            <select
                                value={triggerType}
                                onChange={(e) => setTriggerType(e.target.value)}
                                className="input-base w-full cursor-pointer rounded-lg border px-3 py-2.5 text-sm"
                            >
                                <option value="TaskCreated">Görev oluşturulunca</option>
                                <option value="StatusChangedTo">Durum şuna değişince</option>
                                <option value="TaskAssigned">Görev birine atanınca</option>
                                <option value="CommentAdded">Yorum eklenince</option>
                            </select>
                        </div>

                        {triggerType === 'TaskCreated' && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-secondary">
                                    Koşul
                                </label>

                                <select
                                    value={triggerIssueType}
                                    onChange={(e) => setTriggerIssueType(e.target.value)}
                                    className="input-base w-full cursor-pointer rounded-lg border px-3 py-2.5 text-sm"
                                >
                                    <option value="">Herhangi bir issue type</option>
                                    {issueTypes?.map((t) => (
                                        <option key={t.issueTypeId} value={t.issueTypeId}>
                                            {t.icon} {t.name}
                                        </option>
                                    ))}
                                </select>

                                <p className="mt-1 text-[11px] text-muted">
                                    Boş bırakırsanız bu kural tüm issue type'lar için çalışır.
                                </p>
                            </div>
                        )}

                        {triggerType === 'StatusChangedTo' && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-secondary">
                                    Hedef durum
                                </label>

                                <select
                                    value={triggerStatus}
                                    onChange={(e) => setTriggerStatus(e.target.value)}
                                    className="input-base w-full cursor-pointer rounded-lg border px-3 py-2.5 text-sm"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-secondary">
                                Eylem
                            </label>

                            <select
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value)}
                                className="input-base w-full cursor-pointer rounded-lg border px-3 py-2.5 text-sm"
                            >
                                <option value="NotifyUser">Kullanıcıya bildirim gönder</option>
                                <option value="AssignToUser">Kullanıcıya ata</option>
                            </select>
                        </div>

                        {(actionType === 'NotifyUser' || actionType === 'AssignToUser') && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-secondary">
                                    Kullanıcı
                                </label>

                                <select
                                    value={actionUserId}
                                    onChange={(e) => setActionUserId(e.target.value)}
                                    className="input-base w-full cursor-pointer rounded-lg border px-3 py-2.5 text-sm"
                                >
                                    <option value="">Kullanıcı seçin...</option>
                                    {members?.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.userName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={
                                    !name.trim() ||
                                    createRule.isPending ||
                                    ((actionType === 'NotifyUser' ||
                                        actionType === 'AssignToUser') &&
                                        !actionUserId)
                                }
                                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                                {createRule.isPending ? 'Oluşturuluyor...' : 'Kural Oluştur'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}