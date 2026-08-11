import { AuthenticatedImage } from './AuthenticatedImage';

interface AvatarProps {
    userId: string;
    name: string;
    hasAvatar?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-16 h-16 text-xl',
};

export function Avatar({ userId, name, hasAvatar = true, size = 'sm' }: AvatarProps) {
    const initial = name.charAt(0).toUpperCase();
    const fallback = (
        <span className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold">
            {initial}
        </span>
    );

    return (
        <div className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden shrink-0`}>
            {hasAvatar ? (
                <AuthenticatedImage src={`/users/${userId}/avatar`} alt={name} className="w-full h-full object-cover" fallback={fallback} />
            ) : (
                fallback
            )}
        </div>
    );
}