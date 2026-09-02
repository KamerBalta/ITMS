using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class DashboardWidget : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ProjectId { get; set; } // Dashboard zaten proje bazli calisiyordu, widget'lar da oyle
    public Project Project { get; set; } = default!;

    // "StatusSummary" | "OverviewCards" | "Burndown" | "Velocity" | "Workload" |
    // "MyOpenTasks" | "RoadmapProgress" | "QuickLinks"
    public string WidgetType { get; set; } = default!;

    public string? Title { get; set; } // kullanicinin ozellestirebildigi baslik, null ise varsayilan kullanilir
    public int Width { get; set; } = 1; // 1 = yarim genislik, 2 = tam genislik
    public int DisplayOrder { get; set; }
    public string? ConfigJson { get; set; } // ileride widget'a ozel ayarlar icin (orn. gosterilecek durum sayisi)

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}