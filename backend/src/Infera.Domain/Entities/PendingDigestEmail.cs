using Infera.Domain.Common;

namespace Infera.Domain.Entities;

// Digest moduna alinmis kullanicilar icin, anlik gonderilmeyip biriktirilen bildirimler.
public class PendingDigestEmail : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public string? ActionUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}