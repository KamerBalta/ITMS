using Infera.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infera.Infrastructure.Persistence.Configurations;

public class ProjectMemberConfiguration : IEntityTypeConfiguration<ProjectMember>
{
    public void Configure(EntityTypeBuilder<ProjectMember> b)
    {
        b.ToTable("ProjectMembers");
        b.HasOne(x => x.Project).WithMany(x => x.Members).HasForeignKey(x => x.ProjectId);
        b.HasOne(x => x.Team).WithMany().HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.User).WithMany(x => x.ProjectMemberships).HasForeignKey(x => x.UserId);

       
    }
}