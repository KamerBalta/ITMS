import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export interface TaskFilters {
    search: string;
    onlyMine: boolean;
    teamId: string;
    priority: string;
    labelId: string;
    componentId: string;
}

export function useTaskFilters() {
    const currentUser = useAuthStore((state) => state.user);
    const [search, setSearch] = useState('');
    const [onlyMine, setOnlyMine] = useState(false);
    const [teamId, setTeamId] = useState('');
    const [priority, setPriority] = useState('');
    const [labelId, setLabelId] = useState('');
    const [componentId, setComponentId] = useState('');

    const reset = () => {
        setSearch('');
        setOnlyMine(false);
        setTeamId('');
        setPriority('');
        setLabelId('');
        setComponentId('');
    };

    return {
        search, setSearch, onlyMine, setOnlyMine, teamId, setTeamId,
        priority, setPriority, labelId, setLabelId, componentId, setComponentId, reset,
        currentUserId: currentUser?.userId,
    };
}