using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;

namespace Infera.Application.Features.GitIntegration;

public record SetupGitIntegrationCommand(Guid ProjectId, string Provider, string RepositoryUrl, Guid? CloseTargetStatusId) : IRequest<GitIntegrationSetupDto>;
public record GetGitIntegrationQuery(Guid ProjectId) : IRequest<GitIntegrationDto?>;
public record DeleteGitIntegrationCommand(Guid ProjectId) : IRequest;
public record GetTaskGitCommitsQuery(Guid TaskId) : IRequest<List<GitCommitDto>>;
public record GetAvailableCommitCommandsQuery(Guid ProjectId) : IRequest<List<CommitCommandDto>>;

public record GitIntegrationSetupDto(string WebhookUrl, string WebhookSecret); // secret yalnizca KURULUM aninda bir kez gosterilir
public record GitIntegrationDto(string Provider, string RepositoryUrl, bool IsActive, Guid? CloseTargetStatusId, string WebhookUrl);
public record GitCommitDto(string CommitHash, string CommitMessage, string AuthorName, string? CommitUrl, string? BranchName, DateTime CommittedAt);
public record CommitCommandDto(string Command, string StatusName, string Category);

public class SetupGitIntegrationCommandHandler : IRequestHandler<SetupGitIntegrationCommand, GitIntegrationSetupDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    private readonly IConfiguration _config;

    public SetupGitIntegrationCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth, IConfiguration config)
    {
        _db = db;
        _projectAuth = projectAuth;
        _config = config;
    }

    public async System.Threading.Tasks.Task<GitIntegrationSetupDto> Handle(SetupGitIntegrationCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        if (request.Provider is not ("GitHub" or "GitLab"))
            throw new InvalidOperationException("Yalnızca GitHub ve GitLab destekleniyor.");

        var existing = await _db.ProjectGitIntegrations.FirstOrDefaultAsync(g => g.ProjectId == request.ProjectId, ct);

        // #Git: her kurulumda YENI bir rastgele secret uretilir -- bu, "webhook secret'i
        // bir kez goster, bir daha asla gosterme" pratigine uyar (GitHub Token'lar gibi).
        var secret = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

        if (existing is null)
        {
            existing = new ProjectGitIntegration { ProjectId = request.ProjectId };
            _db.ProjectGitIntegrations.Add(existing);
        }

        existing.Provider = request.Provider;
        existing.RepositoryUrl = request.RepositoryUrl;
        existing.WebhookSecret = secret;
        existing.CloseTargetStatusId = request.CloseTargetStatusId;
        existing.IsActive = true;

        await _db.SaveChangesAsync(ct);

        var baseUrl = _config["Backend:PublicBaseUrl"] ?? "https://your-api-domain.com";
        var webhookUrl = $"{baseUrl.TrimEnd('/')}/api/v1/webhooks/git/{request.ProjectId}";

        return new GitIntegrationSetupDto(webhookUrl, secret);
    }
}

public class GetGitIntegrationQueryHandler : IRequestHandler<GetGitIntegrationQuery, GitIntegrationDto?>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly IConfiguration _config;

    public GetGitIntegrationQueryHandler(IAppDbContext db, IProjectAccessService access, IConfiguration config)
    {
        _db = db;
        _access = access;
        _config = config;
    }

    public async System.Threading.Tasks.Task<GitIntegrationDto?> Handle(GetGitIntegrationQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var integration = await _db.ProjectGitIntegrations.FirstOrDefaultAsync(g => g.ProjectId == request.ProjectId, ct);
        if (integration is null) return null;

        var baseUrl = _config["Backend:PublicBaseUrl"] ?? "https://your-api-domain.com";
        var webhookUrl = $"{baseUrl.TrimEnd('/')}/api/v1/webhooks/git/{request.ProjectId}";

        // #Git: secret ARTIK BURADAN DONDURULMUYOR -- yalnizca ilk kurulum aninda bir kez
        // gosterilir, sonrasinda GET cagrilarinda gizli tutulur (sizinti riski minimize edilir).
        return new GitIntegrationDto(integration.Provider, integration.RepositoryUrl, integration.IsActive, integration.CloseTargetStatusId, webhookUrl);
    }
}

public class GetAvailableCommitCommandsQueryHandler : IRequestHandler<GetAvailableCommitCommandsQuery, List<CommitCommandDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetAvailableCommitCommandsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<CommitCommandDto>> Handle(GetAvailableCommitCommandsQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        // #2: Kullanicinin gorebilecegi "TUM olasi hedefler" -- yani bu projede TANIMLI
        // olan (herhangi bir kaynaktan erisilebilir) tum durumlar. Hangi komutun HANGI
        // mevcut durumdan calisacagi, calisma aninda (webhook geldiginde) kontrol edilir --
        // burada sadece "bu proje icin genel olarak var olan komutlar" listeleniyor.
        var statuses = await _db.ProjectWorkflowStatuses
            .Where(s => s.ProjectId == request.ProjectId && !s.IsDraft)
            .OrderBy(s => s.DisplayOrder)
            .ToListAsync(ct);

        return statuses
            .Select(s => new CommitCommandDto($"#{Infera.Application.Common.Services.SmartCommitParser.SlugifyStatusName(s.Name)}", s.Name, s.Category))
            .ToList();
    }
}

public class DeleteGitIntegrationCommandHandler : IRequestHandler<DeleteGitIntegrationCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public DeleteGitIntegrationCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(DeleteGitIntegrationCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);
        var integration = await _db.ProjectGitIntegrations.FirstOrDefaultAsync(g => g.ProjectId == request.ProjectId, ct);
        if (integration is not null)
        {
            _db.ProjectGitIntegrations.Remove(integration);
            await _db.SaveChangesAsync(ct);
        }
    }
}

public class GetTaskGitCommitsQueryHandler : IRequestHandler<GetTaskGitCommitsQuery, List<GitCommitDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetTaskGitCommitsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<GitCommitDto>> Handle(GetTaskGitCommitsQuery request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct) ?? throw new KeyNotFoundException("Görev bulunamadı.");
        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        return await _db.GitCommitLinks
            .Where(l => l.TaskId == request.TaskId)
            .OrderByDescending(l => l.CommittedAt)
            .Select(l => new GitCommitDto(l.CommitHash, l.CommitMessage, l.AuthorName, l.CommitUrl, l.BranchName, l.CommittedAt))
            .ToListAsync(ct);
    }
}