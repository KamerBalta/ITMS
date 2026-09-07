using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.ResolveIssueKey;

public record ResolveIssueKeyQuery(string IssueKey) : IRequest<Guid>;

public class ResolveIssueKeyQueryHandler : IRequestHandler<ResolveIssueKeyQuery, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public ResolveIssueKeyQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<Guid> Handle(ResolveIssueKeyQuery request, CancellationToken ct)
    {
        // #12: "ITMS-125" -> proje anahtari "ITMS" + gorev numarasi 125. Son "-" karakterinden
        // ayiriyoruz (proje anahtarinin kendisinde tire olmasi beklenmiyor, ama guvenli
        // tarafta kalmak icin LastIndexOf kullaniyoruz).
        var lastDashIndex = request.IssueKey.LastIndexOf('-');
        if (lastDashIndex <= 0 || lastDashIndex == request.IssueKey.Length - 1)
            throw new KeyNotFoundException($"'{request.IssueKey}' geçerli bir issue key formatında değil.");

        var projectKey = request.IssueKey[..lastDashIndex];
        var taskNumberPart = request.IssueKey[(lastDashIndex + 1)..];

        if (!int.TryParse(taskNumberPart, out var taskNumber))
            throw new KeyNotFoundException($"'{request.IssueKey}' geçerli bir issue key formatında değil.");

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Project.Key == projectKey && t.TaskNumber == taskNumber, ct);

        if (task is null)
            throw new KeyNotFoundException($"'{request.IssueKey}' anahtarına sahip bir görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        return task.Id;
    }
}