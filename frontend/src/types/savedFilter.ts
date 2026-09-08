import type { ActiveFilterCriterion } from './filterCriteria';

export interface SerializableFilters {
    search: string;
    onlyMine: boolean;
    teamId: string;
    priority: string;
    labelId: string;
}

export interface SavedFilter {
    id: string;
    name: string;
    filtersJson: string;
    isShared: boolean;
    isOwner: boolean;
    createdByName: string;
}

export function serializeCriteria(
    criteria: ActiveFilterCriterion[]
): string {
    return JSON.stringify(criteria);
}

export function deserializeCriteria(
    json: string
): ActiveFilterCriterion[] {
    try {
        const parsed: unknown = JSON.parse(json);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed as ActiveFilterCriterion[];
    } catch {
        return [];
    }
}