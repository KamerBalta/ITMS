using FluentAssertions;
using Infera.Application.Common.Services;
using Infera.Domain.Entities;
using Infera.Infrastructure.Persistence;
using Xunit;

namespace Infera.Tests;

public class TaskStatusTransitionServiceTests
{
    private sealed record TransitionSetup(
        TaskStatusTransitionService Service,
        AppDbContext Db,
        Guid ProjectId,
        Guid FromStatusId,
        Guid ToStatusId);

    private static TransitionSetup CreateScenario(
        string allowedRoles = "Developer",
        bool requireAssigneeSelf = false,
        bool isDraft = false)
    {
        var db = TestDbContextFactory.Create();

        var projectId = Guid.NewGuid();
        var fromStatusId = Guid.NewGuid();
        var toStatusId = Guid.NewGuid();

        var fromStatus = new ProjectWorkflowStatus
        {
            Id = fromStatusId,
            ProjectId = projectId,
            Name = "To Do",
            Category = "ToDo",
            DisplayOrder = 1,
            IsInitial = true,
            IsDraft = false
        };

        var toStatus = new ProjectWorkflowStatus
        {
            Id = toStatusId,
            ProjectId = projectId,
            Name = "In Progress",
            Category = "InProgress",
            DisplayOrder = 2,
            IsInitial = false,
            IsDraft = false
        };

        var transition = new WorkflowTransition
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            FromStatusId = fromStatusId,
            FromStatus = fromStatus,
            ToStatusId = toStatusId,
            ToStatus = toStatus,
            AllowedRoles = allowedRoles,
            RequireAssigneeSelf = requireAssigneeSelf,
            IsDraft = isDraft
        };

        db.ProjectWorkflowStatuses.AddRange(fromStatus, toStatus);
        db.WorkflowTransitions.Add(transition);
        db.SaveChanges();

        return new TransitionSetup(
            new TaskStatusTransitionService(db),
            db,
            projectId,
            fromStatusId,
            toStatusId);
    }

    // -------------------------------------------------------------------------
    // SAME STATUS
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task AyniStatusaGecis_HerZamanReddedilmeli()
    {
        var db = TestDbContextFactory.Create();
        var service = new TaskStatusTransitionService(db);

        var statusId = Guid.NewGuid();

        var (allowed, error) = await service.CanTransitionAsync(
            Guid.NewGuid(),
            statusId,
            statusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Be("Görev zaten bu durumda.");
    }

    [Fact]
    public async System.Threading.Tasks.Task AyniStatusaGecis_AdminOlsaBileReddedilmeli()
    {
        var db = TestDbContextFactory.Create();
        var service = new TaskStatusTransitionService(db);

        var statusId = Guid.NewGuid();

        var (allowed, error) = await service.CanTransitionAsync(
            Guid.NewGuid(),
            statusId,
            statusId,
            Array.Empty<string>(),
            isAdmin: true,
            isAssignee: false);

        allowed.Should().BeFalse();
        error.Should().Be("Görev zaten bu durumda.");
    }

    // -------------------------------------------------------------------------
    // ADMIN
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task Admin_GecisTanimliOlmasaBile_GeciseIzinVerilmeli()
    {
        var db = TestDbContextFactory.Create();
        var service = new TaskStatusTransitionService(db);

        var (allowed, error) = await service.CanTransitionAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Array.Empty<string>(),
            isAdmin: true,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task Admin_DraftGecisiBileKullanabilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: true,
            isDraft: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            Array.Empty<string>(),
            isAdmin: true,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task Admin_RolKontrolunuBypassEtmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "QA/Tester" },
            isAdmin: true,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task Admin_AssigneeKontrolunuBypassEtmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "QA/Tester" },
            isAdmin: true,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    // -------------------------------------------------------------------------
    // TRANSITION EXISTENCE
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task GecisTanimliDegilse_Reddedilmeli()
    {
        var db = TestDbContextFactory.Create();
        var service = new TaskStatusTransitionService(db);

        var (allowed, error) = await service.CanTransitionAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("tanımlanmamış");
    }

    [Fact]
    public async System.Threading.Tasks.Task YanlisProjectId_IleGecisBulunamamali()
    {
        var scenario = CreateScenario();

        var wrongProjectId = Guid.NewGuid();

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            wrongProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("tanımlanmamış");
    }

    [Fact]
    public async System.Threading.Tasks.Task YanlisFromStatusId_IleGecisBulunamamali()
    {
        var scenario = CreateScenario();

        var wrongFromStatusId = Guid.NewGuid();

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            wrongFromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("tanımlanmamış");
    }

    [Fact]
    public async System.Threading.Tasks.Task YanlisToStatusId_IleGecisBulunamamali()
    {
        var scenario = CreateScenario();

        var wrongToStatusId = Guid.NewGuid();

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            wrongToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("tanımlanmamış");
    }

    // -------------------------------------------------------------------------
    // DRAFT / PUBLISHED
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task DraftGecis_GercekGecisOlarakKullanilmamali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            isDraft: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("tanımlanmamış");
    }

    [Fact]
    public async System.Threading.Tasks.Task YayinlanmisGecis_Kullanilabilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            isDraft: false);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task DraftGecis_VarsaAmaPublishedGecisYoksa_Reddedilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            isDraft: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("tanımlanmamış");
    }

    [Fact]
    public async System.Threading.Tasks.Task DraftVePublishedAyniGecisVarsa_PublishedKullanilmali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            isDraft: true);

        scenario.Db.WorkflowTransitions.Add(new WorkflowTransition
        {
            Id = Guid.NewGuid(),
            ProjectId = scenario.ProjectId,
            FromStatusId = scenario.FromStatusId,
            ToStatusId = scenario.ToStatusId,
            AllowedRoles = "QA/Tester",
            RequireAssigneeSelf = false,
            IsDraft = false
        });

        scenario.Db.SaveChanges();

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "QA/Tester" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    // -------------------------------------------------------------------------
    // ROLE
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task YetkiliRol_GecisYapabilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task YetkisizRol_GecisiYapamamali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "QA/Tester" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("yetkiniz yok");
        error.Should().Contain("Developer");
    }

    [Fact]
    public async System.Threading.Tasks.Task BosRolListesi_GecisiYapamamali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            Array.Empty<string>(),
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("yetkiniz yok");
    }

    [Fact]
    public async System.Threading.Tasks.Task BirdenFazlaRol_IclerindenBiriYetkiliyse_GecisYapabilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer,Project Manager");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "QA/Tester", "Project Manager" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task AllowedRoles_BosluklariTrimlemeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer, Project Manager");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Project Manager" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task KullaniciRolundekiBosluklar_TrimlenmezseEslesmemeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { " Developer " },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("yetkiniz yok");
    }

    [Fact]
    public async System.Threading.Tasks.Task RolKontrolu_CaseSensitiveOlmali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("yetkiniz yok");
    }

    [Fact]
    public async System.Threading.Tasks.Task AllowedRoles_BirdenFazlaRol_Iceriyorsa_HerhangiBiriYeterliOlmali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer,QA/Tester,Project Manager");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "QA/Tester" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    // -------------------------------------------------------------------------
    // ASSIGNEE
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task RequireAssigneeSelf_Aktifse_AtananKullaniciGecisYapabilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task RequireAssigneeSelf_Aktifse_AtanmayanKullaniciReddedilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeFalse();
        error.Should().Contain("atandığı kişi");
    }

    [Fact]
    public async System.Threading.Tasks.Task RequireAssigneeSelf_Pasifse_AtanmayanKullaniciGecisYapabilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: false);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task RequireAssigneeSelf_Aktifse_RolYetkiliOlsaBileAtanmayanKullaniciReddedilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer,Project Manager",
            requireAssigneeSelf: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Project Manager" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeFalse();
        error.Should().Contain("atandığı kişi");
    }

    // -------------------------------------------------------------------------
    // COMBINED RULES
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task RolYetkili_AssigneeDegil_RequireAssigneeSelfFalse_IzinVerilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: false);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task RolYetkisiz_AssigneeOlsaBile_Reddedilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "QA/Tester" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("yetkiniz yok");
    }

    [Fact]
    public async System.Threading.Tasks.Task RolYetkili_AssigneeDegil_RequireAssigneeSelfTrue_Reddedilmeli()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeFalse();
        error.Should().Contain("atandığı kişi");
    }

    // -------------------------------------------------------------------------
    // MULTIPLE TRANSITIONS
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task AyniProje_AyniFromFarkliToGecisleri_BirbirineKaristirilmamali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var anotherToStatusId = Guid.NewGuid();

        scenario.Db.ProjectWorkflowStatuses.Add(new ProjectWorkflowStatus
        {
            Id = anotherToStatusId,
            ProjectId = scenario.ProjectId,
            Name = "Done",
            Category = "Done",
            DisplayOrder = 3,
            IsInitial = false,
            IsDraft = false
        });

        scenario.Db.WorkflowTransitions.Add(new WorkflowTransition
        {
            Id = Guid.NewGuid(),
            ProjectId = scenario.ProjectId,
            FromStatusId = scenario.FromStatusId,
            ToStatusId = anotherToStatusId,
            AllowedRoles = "QA/Tester",
            RequireAssigneeSelf = false,
            IsDraft = false
        });

        scenario.Db.SaveChanges();

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task FarkliProjedeAyniStatusIdler_OlsaBileGecisKarismamali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var anotherProjectId = Guid.NewGuid();

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            anotherProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("tanımlanmamış");
    }

    // -------------------------------------------------------------------------
    // ERROR MESSAGE CONTRACT
    // -------------------------------------------------------------------------

    [Fact]
    public async System.Threading.Tasks.Task YetkisizRol_HataMesajindaGerekliRollerBulunmali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer,Project Manager");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "QA/Tester" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeFalse();
        error.Should().Contain("Developer,Project Manager");
    }

    [Fact]
    public async System.Threading.Tasks.Task AssigneeGerekliHataMesaji_BosOlmamali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer",
            requireAssigneeSelf: true);

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: false);

        allowed.Should().BeFalse();
        error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async System.Threading.Tasks.Task BasariliGeciste_HataMesajiNullOlmali()
    {
        var scenario = CreateScenario(
            allowedRoles: "Developer");

        var (allowed, error) = await scenario.Service.CanTransitionAsync(
            scenario.ProjectId,
            scenario.FromStatusId,
            scenario.ToStatusId,
            new[] { "Developer" },
            isAdmin: false,
            isAssignee: true);

        allowed.Should().BeTrue();
        error.Should().BeNull();
    }
}

