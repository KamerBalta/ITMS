export interface IssueTemplateItem {
    id: string;
    issueTypeId: string;
    issueTypeName: string;
    name: string;
    descriptionTemplate: string | null;
    defaultPriority: number | null;
    isDefault: boolean;
}