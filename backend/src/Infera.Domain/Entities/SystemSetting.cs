using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class SystemSetting : BaseEntity
{
    public string Key { get; set; } = default!;
    public string Value { get; set; } = default!;

    public Guid? UpdatedBy { get; set; }
    public User? UpdatedByUser { get; set; }
    public DateTime? UpdatedAt { get; set; }
}