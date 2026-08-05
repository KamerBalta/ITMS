using Infera.Application.Common.Interfaces;
using Infera.Domain.Common;
using Infera.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Infera.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTeam> ProjectTeams => Set<ProjectTeam>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<Sprint> Sprints => Set<Sprint>();
    public DbSet<Domain.Entities.Task> Tasks => Set<Domain.Entities.Task>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<TaskLabel> TaskLabels => Set<TaskLabel>();
    public DbSet<Watcher> Watchers => Set<Watcher>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Release> Releases => Set<Release>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();
    public DbSet<WorkLog> WorkLogs => Set<WorkLog>();
    public DbSet<RetrospectiveNote> RetrospectiveNotes => Set<RetrospectiveNote>();
    public DbSet<IssueType> IssueTypes => Set<IssueType>();
    public DbSet<ProjectIssueTypeAssignment> ProjectIssueTypeAssignments => Set<ProjectIssueTypeAssignment>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();
    public DbSet<SprintBurndownSnapshot> SprintBurndownSnapshots => Set<SprintBurndownSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // BR-015 / DB-003: ISoftDelete uygulayan tum entity'ler icin global query filter --
        // hicbir handler'da ".Where(x => !x.IsDeleted)" yazmamiza gerek kalmiyor, EF Core
        // otomatik olarak her sorguya ekliyor.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
            {
                var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                var property = System.Linq.Expressions.Expression.Property(parameter, nameof(ISoftDelete.IsDeleted));
                var condition = System.Linq.Expressions.Expression.Equal(property, System.Linq.Expressions.Expression.Constant(false));
                var lambda = System.Linq.Expressions.Expression.Lambda(condition, parameter);

                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
            }
        }

        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // "Remove()" cagrilarini otomatik olarak soft delete'e cevir.
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Deleted && entry.Entity is ISoftDelete softDeletable)
            {
                entry.State = EntityState.Modified;
                softDeletable.IsDeleted = true;
                softDeletable.DeletedAt = DateTime.UtcNow;
                // DeletedBy'i burada set etmiyoruz -- DbContext'in ICurrentUserService'e bagimli
                // olmasini istemedigim icin bu alan su an icin bos kalabilir; ihtiyac olursa
                // ileride SaveChangesInterceptor ile eklenebilir.
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}