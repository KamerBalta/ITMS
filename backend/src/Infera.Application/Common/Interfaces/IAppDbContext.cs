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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}