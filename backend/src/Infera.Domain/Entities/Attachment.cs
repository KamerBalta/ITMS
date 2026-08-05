using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Attachment : BaseEntity, ISoftDelete
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public Guid UploadedBy { get; set; }
    public User Uploader { get; set; } = default!;
    public string ContentType { get; set; } = null!;
    public string FileName { get; set; } = default!;
    public string FilePath { get; set; } = default!;
    public long? FileSize { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}