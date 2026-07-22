using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Attachment : BaseEntity
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public Guid UploadedBy { get; set; }
    public User Uploader { get; set; } = default!;

    public string FileName { get; set; } = default!;
    public string FilePath { get; set; } = default!;
    public long? FileSize { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}