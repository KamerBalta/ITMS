import { Link, useParams } from 'react-router-dom';
import {
    useProjectPermissions,
    useSetProjectPermission,
} from '../../hooks/useProjectPermissions';
import { PERMISSION_LABELS } from '../../types/projectPermission';

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    ViewBoard:
        'Proje board’ını ve görevlerin durumlarını görüntüleyebilir.',
    CreateTask:
        'Bu projede yeni görev oluşturabilir.',
    EditTask:
        'Mevcut görevlerin bilgilerini değiştirebilir.',
    DeleteTask:
        'Projeye ait görevleri silebilir.',
    ManageSprint:
        'Sprint oluşturabilir, başlatabilir ve tamamlayabilir.',
    ManageWorkflow:
        'Workflow durumlarını ve geçişlerini yönetebilir.',
};

export function ProjectPermissionsPage() {
    const { projectId } = useParams<{ projectId: string }>();

    const {
        data: permissions,
        isLoading,
    } = useProjectPermissions(projectId ?? null);

    const setPermission = useSetProjectPermission(projectId!);

    if (!projectId) return null;

    return (
        <div className="max-w-4xl space-y-6">
            {/* Breadcrumb */}
            <div>
                <Link
                    to={`/projects/${projectId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition"
                >
                    ← Proje / Proje Ayarları
                </Link>

                <div className="mt-4">
                    <h1 className="text-xl font-semibold text-primary">
                        Yetkiler
                    </h1>

                    <p className="mt-1 text-sm text-secondary">
                        Bu projede hangi özelliklerin kullanılabileceğini
                        yönetin.
                    </p>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="surface rounded-xl border border-gray-200 p-6 dark:border-gray-700">
                    <div className="space-y-5 animate-pulse">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="flex items-center justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-3 w-64 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>

                                <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="surface overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    {/* Section Header */}
                    <div className="border-b border-gray-200 bg-surface-muted px-5 py-4 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-primary">
                            Proje Yetkileri
                        </h2>

                        <p className="mt-1 text-xs text-secondary">
                            Etkinleştirilen yetkiler bu proje için
                            kullanılabilir.
                        </p>
                    </div>

                    {/* Permissions */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {permissions?.map((p) => {
                            const label =
                                PERMISSION_LABELS[p.permissionKey] ??
                                p.permissionKey;

                            const description =
                                PERMISSION_DESCRIPTIONS[
                                p.permissionKey
                                ] ??
                                'Bu yetkinin proje içerisindeki kullanımını kontrol eder.';

                            return (
                                <div
                                    key={p.permissionKey}
                                    className="flex items-center justify-between gap-6 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-primary">
                                            {label}
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-secondary">
                                            {description}
                                        </p>

                                        <p className="mt-1 text-[10px] text-muted">
                                            {p.permissionKey}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={p.isEnabled}
                                        disabled={
                                            setPermission.isPending
                                        }
                                        onClick={() =>
                                            setPermission.mutate({
                                                key: p.permissionKey,
                                                isEnabled:
                                                    !p.isEnabled,
                                            })
                                        }
                                        className={`
                                            relative inline-flex h-6 w-11
                                            shrink-0 items-center rounded-full
                                            transition-colors
                                            disabled:cursor-wait
                                            disabled:opacity-60
                                            ${p.isEnabled
                                                ? 'bg-indigo-600'
                                                : 'bg-gray-300 dark:bg-gray-700'
                                            }
                                        `}
                                    >
                                        <span
                                            className={`
                                                inline-block h-5 w-5
                                                rounded-full bg-white
                                                shadow-sm transition-transform
                                                ${p.isEnabled
                                                    ? 'translate-x-5'
                                                    : 'translate-x-0.5'
                                                }
                                            `}
                                        />
                                    </button>
                                </div>
                            );
                        })}

                        {(!permissions ||
                            permissions.length === 0) && (
                                <div className="px-5 py-10 text-center">
                                    <p className="text-sm text-secondary">
                                        Bu proje için tanımlanmış bir
                                        yetki bulunmuyor.
                                    </p>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
}