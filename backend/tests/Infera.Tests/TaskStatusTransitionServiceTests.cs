using FluentAssertions;
using Infera.Application.Common.Services;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using Xunit;

namespace Infera.Tests;

public class TaskStatusTransitionServiceTests
{
    private static (TaskStatusTransitionService service, Guid projectId, Infera.Infrastructure.Persistence.AppDbContext db) SetupWithTransition(
        ItemStatus from, ItemStatus to, string allowedRoles, bool requireAssigneeSelf = false)
    {
        var db = TestDbContextFactory.Create();
        var projectId = Guid.NewGuid();

        db.WorkflowTransitions.Add(new WorkflowTransition
        {
            ProjectId = projectId,
            FromStatus = from.ToString(),
            ToStatus = to.ToString(),
            AllowedRoles = allowedRoles,
            RequireAssigneeSelf = requireAssigneeSelf,
        });
        db.SaveChanges();

        return (new TaskStatusTransitionService(db), projectId, db);
    }

    [Fact]
    public async System.Threading.Tasks.Task Gecis_TanimliDegilse_Reddedilmeli()
    {
        var db = TestDbContextFactory.Create();
        var service = new TaskStatusTransitionService(db);

        var (allowed, error) = await service.CanTransitionAsync(
            Guid.NewGuid(), ItemStatus.ToDo, ItemStatus.Done, new List<string> { "Developer" }, isAdmin: false, isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("tanımlanmamış");
    }

    [Fact]
    public async System.Threading.Tasks.Task Admin_HerZaman_GecisYapabilmeli_TanimliOlmasaBile()
    {
        var db = TestDbContextFactory.Create();
        var service = new TaskStatusTransitionService(db);

        var (allowed, _) = await service.CanTransitionAsync(
            Guid.NewGuid(), ItemStatus.ToDo, ItemStatus.Done, new List<string> { "System Admin" }, isAdmin: true, isAssignee: false);

        allowed.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task Rolu_OlmayanKullanici_Reddedilmeli()
    {
        var (service, projectId, _) = SetupWithTransition(ItemStatus.ToDo, ItemStatus.InProgress, "Developer,Project Manager");

        var (allowed, error) = await service.CanTransitionAsync(
            projectId, ItemStatus.ToDo, ItemStatus.InProgress, new List<string> { "QA/Tester" }, isAdmin: false, isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("yetkiniz yok");
    }

    [Fact]
    public async System.Threading.Tasks.Task RequireAssigneeSelf_Aktifken_BaskaKisiReddedilmeli()
    {
        var (service, projectId, _) = SetupWithTransition(ItemStatus.ToDo, ItemStatus.InProgress, "Developer", requireAssigneeSelf: true);

        var (allowed, error) = await service.CanTransitionAsync(
            projectId, ItemStatus.ToDo, ItemStatus.InProgress, new List<string> { "Developer" }, isAdmin: false, isAssignee: false);

        allowed.Should().BeFalse();
        error.Should().Contain("atandığı kişi");
    }

    [Fact]
    public async System.Threading.Tasks.Task RequireAssigneeSelf_Aktifken_AtananKisiKabulEdilmeli()
    {
        var (service, projectId, _) = SetupWithTransition(ItemStatus.ToDo, ItemStatus.InProgress, "Developer", requireAssigneeSelf: true);

        var (allowed, _) = await service.CanTransitionAsync(
            projectId, ItemStatus.ToDo, ItemStatus.InProgress, new List<string> { "Developer" }, isAdmin: false, isAssignee: true);

        allowed.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task AyniDurumaGecis_HerZamanReddedilmeli()
    {
        var (service, projectId, _) = SetupWithTransition(ItemStatus.ToDo, ItemStatus.ToDo, "Developer");

        var (allowed, error) = await service.CanTransitionAsync(
            projectId, ItemStatus.ToDo, ItemStatus.ToDo, new List<string> { "Developer" }, isAdmin: false, isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("zaten bu durumda");
    }

    [Fact]
    public async System.Threading.Tasks.Task FarkliProjedekiGecisKurali_BuProjeyeUygulanmamali()
    {
        var db = TestDbContextFactory.Create();
        var otherProjectId = Guid.NewGuid();

        db.WorkflowTransitions.Add(new WorkflowTransition
        {
            ProjectId = otherProjectId,
            FromStatus = "ToDo",
            ToStatus = "InProgress",
            AllowedRoles = "Developer",
        });
        db.SaveChanges();

        var service = new TaskStatusTransitionService(db);
        var myProjectId = Guid.NewGuid();

        var (allowed, _) = await service.CanTransitionAsync(
            myProjectId, ItemStatus.ToDo, ItemStatus.InProgress, new List<string> { "Developer" }, isAdmin: false, isAssignee: true);

        allowed.Should().BeFalse(); // #Kritik-1'in ayni ruhu: proje izolasyonu burada da dogrulanmali
    }
}