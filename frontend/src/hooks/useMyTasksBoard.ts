import { useQuery } from '@tanstack/react-query';
import { myTasksBoardApi } from '../api/myTasksBoard';

export function useMyTasksBoard() {
    return useQuery({ queryKey: ['my-tasks-board'], queryFn: myTasksBoardApi.get, staleTime: 30_000 });
}