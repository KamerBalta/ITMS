using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Release : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Version { get; set; } = default!;
    public DateOnly? ReleaseDate { get; set; }
    public string? Description { get; set; }
}