using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class ProjectWorkflowStatus : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string? Color { get; set; }

    // Dashboard/Burndown/WIP hesaplamalari icin kategori -- gorevin GERCEK adindan bagimsiz
    // olarak "bu durum ToDo mu, devam ediyor mu, bitti mi" bilgisini tasir.
    public string Category { get; set; } = "ToDo"; // "ToDo" | "InProgress" | "Done"

    public int DisplayOrder { get; set; }
    public bool IsInitial { get; set; } // yeni gorevler bu durumda baslar (proje basina tek biri true olmali)
    public bool IsEpicCloseTarget { get; set; } // Epic kapatma bu duruma gecirir (Category=Done icinde tek biri)

    public bool IsDraft { get; set; } // #Madde-4: yayinlanmamis taslak -- gercek workflow'u etkilemez
    public Guid? BoardColumnId { get; set; }
    public BoardColumn? BoardColumn { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}