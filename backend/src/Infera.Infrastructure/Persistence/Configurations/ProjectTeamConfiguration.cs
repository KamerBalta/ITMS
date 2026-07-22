using Infera.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infera.Infrastructure.Persistence.Configurations;

public class ProjectTeamConfiguration : IEntityTypeConfiguration<ProjectTeam>
{
    public void Configure(EntityTypeBuilder<ProjectTeam> b)
    {
        b.ToTable("ProjectTeams");
        b.HasOne(x => x.Project).WithMany(x => x.ProjectTeams).HasForeignKey(x => x.ProjectId);
        b.HasOne(x => x.Team).WithMany(x => x.ProjectTeams).HasForeignKey(x => x.TeamId);
        b.HasIndex(x => new { x.ProjectId, x.TeamId }).IsUnique();
    }
}