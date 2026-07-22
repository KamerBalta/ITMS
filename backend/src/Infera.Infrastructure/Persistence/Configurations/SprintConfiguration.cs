using Infera.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infera.Infrastructure.Persistence.Configurations;

public class SprintConfiguration : IEntityTypeConfiguration<Sprint>
{
    public void Configure(EntityTypeBuilder<Sprint> b)
    {
        b.ToTable("Sprints");
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.HasOne(x => x.Project).WithMany(x => x.Sprints).HasForeignKey(x => x.ProjectId);
    }
}