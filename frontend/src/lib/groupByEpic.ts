export interface HasParent {
    id: string;
    parentTaskId: string | null;
}

const EPIC_COLORS = ['border-purple-300', 'border-blue-300', 'border-green-300', 'border-orange-300', 'border-pink-300'];

export function colorForEpic(epicId: string) {
    let hash = 0;
    for (let i = 0; i < epicId.length; i++) hash = (hash + epicId.charCodeAt(i)) % EPIC_COLORS.length;
    return EPIC_COLORS[hash];
}