using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class SavedFilter : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = default!;

    public string Name { get; set; } = default!;

   
    public string FiltersJson { get; set; } = "{}";

    public string Scope { get; set; } = default!;

    public bool IsShared { get; set; } // false = yalnizca olusturan gorur, true = tum proje uyeleri gorur
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}