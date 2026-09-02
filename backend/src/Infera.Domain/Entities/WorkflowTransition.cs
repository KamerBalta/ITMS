using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class WorkflowTransition : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid FromStatusId { get; set; }
    public ProjectWorkflowStatus FromStatus { get; set; } = default!;

    public Guid ToStatusId { get; set; }
    public ProjectWorkflowStatus ToStatus { get; set; } = default!;

    public string AllowedRoles { get; set; } = default!;
    public bool RequireAssigneeSelf { get; set; }

    public bool IsDraft { get; set; } // #Madde-4: yayinlanmamis taslak -- gercek gecislerde kullanilmaz

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}