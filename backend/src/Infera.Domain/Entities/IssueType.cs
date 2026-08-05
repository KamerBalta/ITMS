using Infera.Domain.Common;

namespace Infera.Domain.Entities;

// Sistem genelinde tanimli, projeye bagli olmayan global Issue Type katalogu.
public class IssueType : BaseEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }

    // 0 = Herkes, 1 = Developer ve ustu, 2 = Yalnizca PM/Admin
    public int CreatorTier { get; set; }

    public bool AllowsChildren { get; set; }
    public bool RequiresParent { get; set; }

    // Epic/Story/Task/Bug -- global katalogdan silinemez, yalnizca pasiflestirilebilir.
    public bool IsSystemDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}