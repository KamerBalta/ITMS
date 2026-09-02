using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class IssueTemplate : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid IssueTypeId { get; set; }
    public IssueType IssueType { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string? DescriptionTemplate { get; set; } // Markdown, onceden doldurulmus icerik
    public int? DefaultPriority { get; set; } // Priority enum degeri, null = degistirme

    public bool IsDefault { get; set; } // bu Issue Type icin varsayilan sablon mu (otomatik onerilir)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}