using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class AutomationRule : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string TriggerType { get; set; } = default!; // "TaskCreated", "StatusChangedTo", "TaskAssigned"
    public string? TriggerConditionJson { get; set; } // orn. {"issueTypeName":"Bug"} ya da {"status":"Done"}

    public string ActionType { get; set; } = default!; // "AssignToUser", "NotifyUser", "AddLabel", "SetPriority"
    public string ActionParamsJson { get; set; } = "{}";

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}