using Infera.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infera.Infrastructure.Persistence.Configurations;

public class TaskConfiguration : IEntityTypeConfiguration<Domain.Entities.Task>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Task> b)
    {
        b.ToTable("Tasks");
        b.Property(x => x.Title).HasMaxLength(255).IsRequired();

        b.HasOne(x => x.Project).WithMany(x => x.Tasks).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Sprint).WithMany(x => x.Tasks).HasForeignKey(x => x.SprintId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.ParentTask).WithMany().HasForeignKey(x => x.ParentTaskId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Assignee).WithMany().HasForeignKey(x => x.AssigneeId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.Reporter).WithMany().HasForeignKey(x => x.ReporterId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.IssueType).WithMany().HasForeignKey(x => x.IssueTypeId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.WorkflowStatus).WithMany().HasForeignKey(x => x.StatusId).OnDelete(DeleteBehavior.Restrict);

        // PostgreSQL'in yerlesik xmin sistem kolonunu concurrency token olarak kullaniyoruz --
        // ayri bir kolon eklemeye/senkron tutmaya gerek kalmiyor, veritabani bunu otomatik yonetiyor.
       

        b.HasOne(x => x.Release).WithMany(x => x.Tasks).HasForeignKey(x => x.ReleaseId).OnDelete(DeleteBehavior.SetNull);
    }
}