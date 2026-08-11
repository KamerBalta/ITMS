using Infera.Domain.Common;

namespace Infera.Domain.Entities;

// Proje bazli durum gecis kurali: "FromStatus -> ToStatus gecisini AllowedRoles'daki roller yapabilir"
public class WorkflowTransition : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string FromStatus { get; set; } = default!;
    public string ToStatus { get; set; } = default!;

    // Virgulle ayrilmis rol listesi, orn. "Project Manager,System Admin" -- basit tutmak icin
    // ayri bir iliski tablosu yerine string kullaniyoruz, PostgreSQL'de arama gerekmiyor.
    public string AllowedRoles { get; set; } = default!;

    public bool RequireAssigneeSelf { get; set; } // true ise: yalnizca gorevin atandigi kisi + izinli roller

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}