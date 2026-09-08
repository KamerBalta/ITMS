import type {
    ActiveFilterCriterion,
    ResolvedFilterQuery,
} from '../types/filterCriteria';

export function resolveFilterCriteria(
    criteria: ActiveFilterCriterion[] | null | undefined
): ResolvedFilterQuery {
    const result: ResolvedFilterQuery = {};

    if (!Array.isArray(criteria)) {
        return result;
    }

    for (const c of criteria) {
        if (!c.value) continue;

        switch (c.field) {
            case 'status':
                result.status = c.value;
                break;

            case 'assignee':
                if (c.value === 'unassigned') {
                    result.unassignedOnly = true;
                } else {
                    result.assigneeId = c.value;
                }
                break;

            case 'reporter':
                result.reporterId = c.value;
                break;

            case 'priority':
                result.priority = Number(c.value);
                break;

            case 'issueType':
                result.issueTypeId = c.value;
                break;

            case 'sprint':
                if (c.value === 'backlog') {
                    result.backlogOnly = true;
                } else {
                    result.sprintId = c.value;
                }
                break;

            case 'label':
                result.labelId = c.value;
                break;

            case 'component':
                result.componentId = c.value;
                break;

            case 'created': {
                const [dir, date] = c.value.split(':');

                if (dir === 'after') {
                    result.createdAfter = date;
                } else if (dir === 'before') {
                    result.createdBefore = date;
                }

                break;
            }

            case 'dueDate': {
                const [dir, date] = c.value.split(':');

                if (dir === 'after') {
                    result.dueDateAfter = date;
                } else if (dir === 'before') {
                    result.dueDateBefore = date;
                }

                break;
            }

            case 'updated': {
                const [dir, date] = c.value.split(':');

                if (dir === 'after') {
                    result.updatedAfter = date;
                } else if (dir === 'before') {
                    result.updatedBefore = date;
                }

                break;
            }
        }
    }

    return result;
}