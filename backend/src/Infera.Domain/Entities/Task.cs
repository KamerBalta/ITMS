using Infera.Domain.Common;
using Infera.Domain.Enums;

namespace Infera.Domain.Entities;

public class Task : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid? SprintId { get; set; }
    public Sprint? Sprint { get; set; }

    public Guid? ParentTaskId { get; set; }
    public Task? ParentTask { get; set; }

    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public IssueType IssueType { get; set; }
    public Priority Priority { get; set; }
    public int? StoryPoint { get; set; }
    public ItemStatus Status { get; set; } = ItemStatus.ToDo;

    public Guid? AssigneeId { get; set; }
    public User? Assignee { get; set; }

    public Guid ReporterId { get; set; }
    public User Reporter { get; set; } = default!;

    public DateTime? DueDate { get; set; }
    public long Rank { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
    public ICollection<Watcher> Watchers { get; set; } = new List<Watcher>();
    public ICollection<ChecklistItem> ChecklistItems { get; set; } = new List<ChecklistItem>();
    public ICollection<WorkLog> WorkLogs { get; set; } = new List<WorkLog>();
}