import { useState } from 'react';

export function usePagination(pageSize = 25) {
    const [page, setPage] = useState(1);

    const reset = () => setPage(1);

    return { page, setPage, pageSize, reset };
}