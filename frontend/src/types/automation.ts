export interface AutomationRule {
    id: string;
    name: string;
    triggerType: string;
    triggerConditionJson: string | null;
    actionType: string;
    actionParamsJson: string;
    isActive: boolean;
}