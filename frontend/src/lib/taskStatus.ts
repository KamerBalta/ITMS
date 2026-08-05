import type { ItemStatus } from '../types/task';

// Backend'deki Infera.Domain.Enums.ItemStatus ile birebir sirali eslesmeli
export const STATUS_TO_INT: Record<ItemStatus, number> = {
    ToDo: 0,
    InProgress: 1,
    ReadyForReview: 2,
    ReadyForQA: 3,
    Done: 4,
    Closed: 5,
};

export const BOARD_COLUMNS: { status: ItemStatus; label: string }[] = [
    { status: 'ToDo', label: 'To Do' },
    { status: 'InProgress', label: 'In Progress' },
    { status: 'ReadyForReview', label: 'Ready for Review' },
    { status: 'ReadyForQA', label: 'Ready for QA' },
    { status: 'Done', label: 'Done' },
];