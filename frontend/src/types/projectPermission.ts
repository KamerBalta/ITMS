export interface ProjectPermission {
    permissionKey: string;
    isEnabled: boolean;
}

export const PERMISSION_LABELS: Record<string, string> = {
    DeveloperCanManageSprints: "Developer'lar Sprint oluşturabilir/tamamlayabilir",
    DeveloperCanReassign: "Developer'lar görev atamasını değiştirebilir",
};