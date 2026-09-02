using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.FindSimilarTasks;

public record FindSimilarTasksQuery(Guid ProjectId, string Title) : IRequest<List<SimilarTaskDto>>;

public record SimilarTaskDto(Guid Id, string IssueKey, string Title, string StatusName, double SimilarityScore);

public class FindSimilarTasksQueryHandler : IRequestHandler<FindSimilarTasksQuery, List<SimilarTaskDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public FindSimilarTasksQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<List<SimilarTaskDto>> Handle(FindSimilarTasksQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length < 8)
            return new List<SimilarTaskDto>(); // cok kisa basliklarda yanlis pozitif riski yuksek, kontrol etmeye deger degil

        var cutoffDate = DateTime.UtcNow.AddDays(-90);

        // #C: agir bir islem oldugu icin (kelime karsilastirmasi DB'de degil bellekte
        // yapiliyor), son 90 gunun gorevlerine ve makul bir ust sinira (300) kisitliyoruz.
        var recentTasks = await _db.Tasks
            .Where(t => t.ProjectId == request.ProjectId && t.CreatedAt >= cutoffDate)
            .Select(t => new { t.Id, t.Title, IssueKey = t.Project.Key + "-" + t.TaskNumber, StatusName = t.WorkflowStatus.Name })
            .Take(300)
            .ToListAsync(ct);

        var inputWords = NormalizeAndSplit(request.Title);
        if (inputWords.Count == 0) return new List<SimilarTaskDto>();

        var results = recentTasks
            .Select(t => new { t.Id, t.Title, t.IssueKey, t.StatusName, Score = JaccardSimilarity(inputWords, NormalizeAndSplit(t.Title)) })
            .Where(t => t.Score >= 0.5) // #C: kelimelerin en az yarisi ortusuyorsa "benzer" say
            .OrderByDescending(t => t.Score)
            .Take(5)
            .Select(t => new SimilarTaskDto(t.Id, t.IssueKey, t.Title, t.StatusName, t.Score))
            .ToList();

        return results;
    }

    private static HashSet<string> NormalizeAndSplit(string text) =>
        text.ToLowerInvariant()
            .Split(new[] { ' ', '-', '_', ',', '.', ':' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 2) // "ve", "bir" gibi kisa baglaclari es gec
            .ToHashSet();

    // Jaccard benzerligi: iki kume arasindaki kesisimin, birlesime oranidir --
    // basit ama etkili bir "kac kelime ortak" olcusu.
    private static double JaccardSimilarity(HashSet<string> a, HashSet<string> b)
    {
        if (a.Count == 0 || b.Count == 0) return 0;
        var intersection = a.Intersect(b).Count();
        var union = a.Union(b).Count();
        return union == 0 ? 0 : (double)intersection / union;
    }
}