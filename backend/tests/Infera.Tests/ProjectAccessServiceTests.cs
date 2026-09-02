using FluentAssertions;
using Infera.Application.Common.Services;
using Infera.Domain.Entities;
using Xunit;

namespace Infera.Tests;

public class ProjectAccessServiceTests
{
    [Fact]
    public async System.Threading.Tasks.Task Admin_TumProjelereErisebilmeli()
    {
        var db = TestDbContextFactory.Create();
        var project = new Project { Name = "Test", Key = "TST", OwnerId = Guid.NewGuid() };
        db.Projects.Add(project);
        db.SaveChanges();

        var currentUser = new FakeCurrentUserService { IsAdmin = true };
        var service = new ProjectAccessService(db, currentUser);

        var hasAccess = await service.HasProjectAccessAsync(project.Id);

        hasAccess.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task Uyesi_OlmayanKullanici_ErisimReddedilmeli()
    {
        var db = TestDbContextFactory.Create();
        var project = new Project { Name = "Test", Key = "TST", OwnerId = Guid.NewGuid() };
        db.Projects.Add(project);
        db.SaveChanges();

        var currentUser = new FakeCurrentUserService { IsAdmin = false, UserId = Guid.NewGuid() };
        var service = new ProjectAccessService(db, currentUser);

        var hasAccess = await service.HasProjectAccessAsync(project.Id);

        hasAccess.Should().BeFalse();
    }

    [Fact]
    public async System.Threading.Tasks.Task ProjectMember_OlanKullanici_ErisebilmeliText()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var teamId = Guid.NewGuid();

        var project = new Project { Name = "Test", Key = "TST", OwnerId = Guid.NewGuid() };
        db.Projects.Add(project);
        db.ProjectMembers.Add(new ProjectMember { ProjectId = project.Id, UserId = userId, TeamId = teamId });
        db.SaveChanges();

        var currentUser = new FakeCurrentUserService { IsAdmin = false, UserId = userId };
        var service = new ProjectAccessService(db, currentUser);

        var hasAccess = await service.HasProjectAccessAsync(project.Id);

        hasAccess.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetAccessibleProjectIds_YalnizcaUyeOlunanProjeleriDondurmeli()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var teamId = Guid.NewGuid();

        var myProject = new Project { Name = "Benim", Key = "MY1", OwnerId = Guid.NewGuid() };
        var otherProject = new Project { Name = "Baskasinin", Key = "OTH", OwnerId = Guid.NewGuid() };
        db.Projects.AddRange(myProject, otherProject);
        db.ProjectMembers.Add(new ProjectMember { ProjectId = myProject.Id, UserId = userId, TeamId = teamId });
        db.SaveChanges();

        var currentUser = new FakeCurrentUserService { IsAdmin = false, UserId = userId };
        var service = new ProjectAccessService(db, currentUser);

        var accessibleIds = await service.GetAccessibleProjectIdsAsync();

        accessibleIds.Should().ContainSingle().Which.Should().Be(myProject.Id);
    }
}