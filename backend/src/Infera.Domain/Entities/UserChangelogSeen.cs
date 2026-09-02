using Infera.Domain.Common;

namespace Infera.Domain.Entities;

// Bir kullanicinin en son GORDUGU changelog girdisinin tarihi -- bundan sonraki
// tum girdiler "okunmamis" sayilir.
public class UserChangelogSeen : BaseEntity
{
    public Guid UserId { get; set; }
    public DateTime LastSeenAt { get; set; }
}