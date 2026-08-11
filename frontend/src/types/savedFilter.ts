export interface SavedFilter {
    id: string;
    name: string;
    filtersJson: string;
    isShared: boolean;
    isOwner: boolean;
    createdByName: string;
}

// TaskFilters'in serialize edilebilir hali (currentUserId gibi runtime-only alanlar haric)
export interface SerializableFilters {
    search: string;
    onlyMine: boolean;
    teamId: string;
    priority: string;
    labelId: string;
}