using Infera.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Team> Teams { get; }
    DbSet<TeamMember> TeamMembers { get; }
    DbSet<Project> Projects { get; }
    DbSet<ProjectTeam> ProjectTeams { get; }
    DbSet<ProjectMember> ProjectMembers { get; }
    DbSet<Sprint> Sprints { get; }
    DbSet<Domain.Entities.Task> Tasks { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Attachment> Attachments { get; }
    DbSet<Label> Labels { get; }
    DbSet<TaskLabel> TaskLabels { get; }
    DbSet<Watcher> Watchers { get; }
    DbSet<ChecklistItem> ChecklistItems { get; }
    DbSet<Release> Releases { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<ActivityLog> ActivityLogs { get; }
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<WorkLog> WorkLogs { get; }
    DbSet<RetrospectiveNote> RetrospectiveNotes { get; }
    DbSet<IssueType> IssueTypes { get; }
    DbSet<ProjectIssueTypeAssignment> ProjectIssueTypeAssignments { get; }
    DbSet<NotificationPreference> NotificationPreferences { get; }
    DbSet<SprintBurndownSnapshot> SprintBurndownSnapshots { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}