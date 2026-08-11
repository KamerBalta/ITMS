import { useState } from 'react';
import { AuthenticatedImage } from './AuthenticatedImage';
import type { ProjectMemberItem } from '../types/projectMember';

interface AssigneeAvatarFilterProps {
    members: ProjectMemberItem[];
    selectedUserIds: Set<string>;
    onToggle: (userId: string) => void;
    maxVisible?: number;
}

function Avatar({ member, isSelected, onClick }: { member: ProjectMemberItem; isSelected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={member.userName}
            className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900'
                    : 'border-white dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
        >
            {member.avatarUrl ? (
                <AuthenticatedImage
                    src={`/users/${member.userId}/avatar`}
                    alt={member.userName}
                    className="w-full h-full object-cover"
                    fallback={
                        <span className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                            {member.userName.charAt(0).toUpperCase()}
                        </span>
                    }
                />
            ) : (
                <span className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    {member.userName.charAt(0).toUpperCase()}
                </span>
            )}
        </button>
    );
}

export function AssigneeAvatarFilter({ members, selectedUserIds, onToggle, maxVisible = 6 }: AssigneeAvatarFilterProps) {
    const [showOverflow, setShowOverflow] = useState(false);

    if (members.length === 0) return null;

    const visible = members.slice(0, maxVisible);
    const overflow = members.slice(maxVisible);

    return (
        <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted mr-1">Ekip:</span>
            {visible.map((m) => (
                <Avatar key={m.userId} member={m} isSelected={selectedUserIds.has(m.userId)} onClick={() => onToggle(m.userId)} />
            ))}

            {overflow.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => setShowOverflow((v) => !v)}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-secondary text-xs font-medium flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                    >
                        +{overflow.length}
                    </button>
                    {showOverflow && (
                        <div className="absolute top-full mt-1 left-0 surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10 w-48 max-h-56 overflow-y-auto">
                            {overflow.map((m) => (
                                <label key={m.userId} className="flex items-center gap-2 px-1 py-1 text-sm text-secondary hover-surface rounded cursor-pointer">
                                    <input type="checkbox" checked={selectedUserIds.has(m.userId)} onChange={() => onToggle(m.userId)} className="rounded cursor-pointer" />
                                    {m.userName}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedUserIds.size > 0 && (
                <button onClick={() => selectedUserIds.forEach((id) => onToggle(id))} className="text-xs text-muted hover:underline ml-1 cursor-pointer">
                    Temizle
                </button>
            )}
        </div>
    );
}