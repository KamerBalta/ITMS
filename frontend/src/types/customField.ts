export interface CustomFieldDefinition {
    id: string;
    name: string;
    fieldType: 'text' | 'number' | 'select' | 'user';
    optionsJson: string | null;
    isRequired: boolean;
    displayOrder: number;
}

export interface TaskCustomFieldValue {
    fieldId: string;
    name: string;
    fieldType: string;
    value: string | null;
}