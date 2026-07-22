using Infera.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infera.Infrastructure.Persistence.Configurations;

public class TeamMemberConfiguration : IEntityTypeConfiguration<TeamMember>
{
    public void Configure(EntityTypeBuilder<TeamMember> b)
    {
        b.ToTable("TeamMembers");
        b.HasOne(x => x.Team).WithMany(x => x.Members).HasForeignKey(x => x.TeamId);
        b.HasOne(x => x.User).WithMany(x => x.TeamMemberships).HasForeignKey(x => x.UserId);
        b.HasIndex(x => new { x.TeamId, x.UserId }).IsUnique();
    }
}