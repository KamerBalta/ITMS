import { AuthenticatedImage } from './AuthenticatedImage';

interface AvatarProps {
    userId: string;
    name: string;
    hasAvatar?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    refreshKey?: number;
}

const SIZE_CLASSES = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-16 h-16 text-xl',
};

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return '?';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function Avatar({
    userId,
    name,
    hasAvatar = true,
    size = 'sm',
    refreshKey = 0,
}: AvatarProps) {
    const initials = getInitials(name);

    const fallback = (
        <span className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
            {initials}
        </span>
    );

    return (
        <div className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden shrink-0`}>
            {hasAvatar ? (
                <AuthenticatedImage
                    src={`/users/${userId}/avatar`}
                    alt={name}
                    className="w-full h-full object-cover"
                    fallback={fallback}
                    cacheKey={`avatar:${userId}`}
                    refreshKey={refreshKey}
                />
            ) : (
                fallback
            )}
        </div>
    );
}