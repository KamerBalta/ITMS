using Infera.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infera.Infrastructure.Persistence.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> b)
    {
        b.ToTable("Comments");
        b.HasOne(x => x.Task).WithMany(x => x.Comments).HasForeignKey(x => x.TaskId);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> b)
    {
        b.ToTable("Attachments");
        b.HasOne(x => x.Task).WithMany(x => x.Attachments).HasForeignKey(x => x.TaskId);
        b.HasOne(x => x.Uploader).WithMany().HasForeignKey(x => x.UploadedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> b)
    {
        b.ToTable("Labels");
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.HasIndex(x => x.Name).IsUnique().HasFilter("\"IsDeleted\" = false");
    }
}

public class TaskLabelConfiguration : IEntityTypeConfiguration<TaskLabel>
{
    public void Configure(EntityTypeBuilder<TaskLabel> b)
    {
        b.ToTable("TaskLabels");
        b.HasOne(x => x.Task).WithMany(x => x.TaskLabels).HasForeignKey(x => x.TaskId);
        b.HasOne(x => x.Label).WithMany(x => x.TaskLabels).HasForeignKey(x => x.LabelId);
        b.HasIndex(x => new { x.TaskId, x.LabelId }).IsUnique();
    }
}

public class WatcherConfiguration : IEntityTypeConfiguration<Watcher>
{
    public void Configure(EntityTypeBuilder<Watcher> b)
    {
        b.ToTable("Watchers");
        b.HasOne(x => x.Task).WithMany(x => x.Watchers).HasForeignKey(x => x.TaskId);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.TaskId, x.UserId }).IsUnique();
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications");
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
    }
}

public class ReleaseConfiguration : IEntityTypeConfiguration<Release>
{
    public void Configure(EntityTypeBuilder<Release> b)
    {
        b.ToTable("Releases");
        b.Property(x => x.Version).HasMaxLength(50).IsRequired();
        b.HasOne(x => x.Project).WithMany(x => x.Releases).HasForeignKey(x => x.ProjectId);
    }
}

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> b)
    {
        b.ToTable("ActivityLogs");
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("AuditLogs");
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("RefreshTokens");
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
    }
}

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> b)
    {
        b.ToTable("SystemSettings");
        b.Property(x => x.Key).HasMaxLength(150).IsRequired();
        b.HasIndex(x => x.Key).IsUnique();
        b.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class ChecklistItemConfiguration : IEntityTypeConfiguration<ChecklistItem>
{
    public void Configure(EntityTypeBuilder<ChecklistItem> b)
    {
        b.ToTable("ChecklistItems");
        b.HasOne(x => x.Task).WithMany(x => x.ChecklistItems).HasForeignKey(x => x.TaskId);
    }
}

public class WorkLogConfiguration : IEntityTypeConfiguration<WorkLog>
{
    public void Configure(EntityTypeBuilder<WorkLog> b)
    {
        b.ToTable("WorkLogs");
        b.HasOne(x => x.Task).WithMany(x => x.WorkLogs).HasForeignKey(x => x.TaskId);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
public class RetrospectiveNoteConfiguration : IEntityTypeConfiguration<RetrospectiveNote>
{
    public void Configure(EntityTypeBuilder<RetrospectiveNote> b)
    {
        b.ToTable("RetrospectiveNotes");
        b.Property(x => x.Category).HasMaxLength(20).IsRequired();
        b.HasOne(x => x.Sprint).WithMany().HasForeignKey(x => x.SprintId);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
public class NotificationPreferenceConfiguration : IEntityTypeConfiguration<NotificationPreference>
{
    public void Configure(EntityTypeBuilder<NotificationPreference> b)
    {
        b.ToTable("NotificationPreferences");
        b.Property(x => x.NotificationType).HasMaxLength(20).IsRequired();
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        b.HasIndex(x => new { x.UserId, x.NotificationType }).IsUnique();
    }
}
public class IssueTypeConfiguration : IEntityTypeConfiguration<IssueType>
{
    public void Configure(EntityTypeBuilder<IssueType> b)
    {
        b.ToTable("IssueTypes");
        b.Property(x => x.Name).HasMaxLength(50).IsRequired();
        b.Property(x => x.Description).HasMaxLength(300);
        b.Property(x => x.Icon).HasMaxLength(10);
        b.HasIndex(x => x.Name).IsUnique();
    }
}

public class ProjectIssueTypeAssignmentConfiguration : IEntityTypeConfiguration<ProjectIssueTypeAssignment>
{
    public void Configure(EntityTypeBuilder<ProjectIssueTypeAssignment> b)
    {
        b.ToTable("ProjectIssueTypeAssignments");
        b.HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId);
        b.HasOne(x => x.IssueType).WithMany().HasForeignKey(x => x.IssueTypeId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.ProjectId, x.IssueTypeId }).IsUnique();
    }
}
public class SprintBurndownSnapshotConfiguration : IEntityTypeConfiguration<SprintBurndownSnapshot>
{
    public void Configure(EntityTypeBuilder<SprintBurndownSnapshot> b)
    {
        b.ToTable("SprintBurndownSnapshots");
        b.HasOne(x => x.Sprint).WithMany().HasForeignKey(x => x.SprintId);
        b.HasIndex(x => new { x.SprintId, x.SnapshotDate }).IsUnique();
    }
}