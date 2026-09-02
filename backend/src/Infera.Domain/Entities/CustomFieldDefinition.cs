using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class CustomFieldDefinition : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string FieldType { get; set; } = default!; // "text", "number", "select", "user"
    public string? OptionsJson { get; set; } // FieldType=select icin secenek listesi (JSON array)
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}