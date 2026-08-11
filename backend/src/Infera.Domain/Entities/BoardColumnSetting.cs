using Infera.Domain.Common;

namespace Infera.Domain.Entities;

// Proje bazli, durum (kolon) basina maksimum acik gorev sayisi.
public class BoardColumnSetting : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Status { get; set; } = default!; // "ToDo", "InProgress" vb. -- ItemStatus enum adiyla eslesir
    public int? WipLimit { get; set; } // null = sinirsiz
}