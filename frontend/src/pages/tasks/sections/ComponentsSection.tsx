import { useComponents, useAddComponentToTask, useRemoveComponentFromTask } from '../../../hooks/useComponents';
import { MultiSelectSearch } from '../../../components/MultiSelectSearch';

interface TaskComponentItem {
    id: string;
    name: string;
    leadUserId: string | null;
    leadUserName: string | null;
}

export function ComponentsSection({
    taskId,
    projectId,
    currentComponents,
}: {
    taskId: string;
    projectId: string;
    currentComponents: TaskComponentItem[];
}) {
    const { data: allComponents } = useComponents(projectId);
    const addComponent = useAddComponentToTask(taskId);
    const removeComponent = useRemoveComponentFromTask(taskId);

    if (!allComponents || allComponents.length === 0) return null;

    const handleToggle = (componentId: string) => {
        const isSelected = currentComponents.some((c) => c.id === componentId);
        if (isSelected) removeComponent.mutate(componentId);
        else addComponent.mutate(componentId);
    };

    return (
        <div className="surface border rounded-lg p-4">
            <MultiSelectSearch
                label="Component/s (Bileşenler)"
                items={allComponents.map((c) => ({ id: c.id, name: c.name }))}
                selectedIds={currentComponents.map((c) => c.id)}
                onToggle={handleToggle}
                placeholder="Component ara..."
            />
        </div>
    );
}