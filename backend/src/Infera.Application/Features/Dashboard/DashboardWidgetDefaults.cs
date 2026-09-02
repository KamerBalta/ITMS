using Infera.Domain.Entities;

namespace Infera.Application.Features.Dashboard;

public static class DashboardWidgetDefaults
{
    // #Özelleştirilebilir-Dashboard: mevcut sabit Dashboard'un BIREBIR ayni gorunumu --
    // hicbir kullanici degisiklikten once/sonra bos bir ekranla karsilasmasin diye,
    // ilk kez widget listesi cekildiginde (hic widget yoksa) bu varsayilan set otomatik olusturulur.
    public static List<DashboardWidget> BuildDefaults(Guid userId, Guid projectId) => new()
    {
        new DashboardWidget { UserId = userId, ProjectId = projectId, WidgetType = "StatusSummary", Width = 2, DisplayOrder = 0 },
        new DashboardWidget { UserId = userId, ProjectId = projectId, WidgetType = "OverviewCards", Width = 2, DisplayOrder = 1 },
        new DashboardWidget { UserId = userId, ProjectId = projectId, WidgetType = "Burndown", Width = 2, DisplayOrder = 2 },
        new DashboardWidget { UserId = userId, ProjectId = projectId, WidgetType = "Velocity", Width = 2, DisplayOrder = 3 },
        new DashboardWidget { UserId = userId, ProjectId = projectId, WidgetType = "Workload", Width = 2, DisplayOrder = 4 },
    };
}