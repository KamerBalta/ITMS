using Infera.Domain.Common;

namespace Infera.Domain.Entities;

// Bir Status'un, HANGI BOARD'da hangi Column'a duştugunu tutar -- ayni Status,
// Scrum board'da "In Progress" kolonunda, Kanban board'da "Devam Ediyor" kolonunda
// gorunebilir; bu ikisi birbirinden tamamen bagimsiz haritalar.
public class BoardStatusColumnMapping : BaseEntity
{
    public Guid BoardId { get; set; }
    public Board Board { get; set; } = default!;

    public Guid StatusId { get; set; }
    public ProjectWorkflowStatus Status { get; set; } = default!;

    public Guid ColumnId { get; set; }
    public BoardColumn Column { get; set; } = default!;
}