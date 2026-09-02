using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Search.GlobalSearch;

public class GlobalSearchQueryHandler : IRequestHandler<GlobalSearchQuery, SearchResultsDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GlobalSearchQueryHandler(
        IAppDbContext db,
        IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async Task<SearchResultsDto> Handle(
        GlobalSearchQuery request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Query) || request.Query.Length < 2)
            return new SearchResultsDto(new(), new(), new());

        var pattern = $"%{request.Query}%";

        var normalizedQuery = request.Query
            .Replace("-", "")
            .Replace(" ", "");

        var accessibleProjectIds =
            await _access.GetAccessibleProjectIdsAsync(ct);

        // ---------------------------------------------------------
        // TASK SEARCH
        // ---------------------------------------------------------
        var tasks = await _db.Tasks
            .Where(t =>
                accessibleProjectIds.Contains(t.ProjectId) &&
                (
                    EF.Functions.ToTsVector(
                        "simple",
                        t.Title
                    ).Matches(
                        EF.Functions.PlainToTsQuery(
                            "simple",
                            request.Query
                        )
                    )

                    // WS-15
                    || EF.Functions.ILike(
                        t.Project.Key + "-" + t.TaskNumber,
                        pattern
                    )

                    // WS15
                    || EF.Functions.ILike(
                        t.Project.Key + t.TaskNumber,
                        "%" + normalizedQuery + "%"
                    )

                    // W15 gibi gevşek eşleşme
                    || (
                        normalizedQuery.Length >= 3 &&
                        EF.Functions.ILike(
                            t.Project.Key,
                            normalizedQuery.Substring(0, 1) + "%"
                        ) &&
                        EF.Functions.ILike(
                            t.TaskNumber.ToString(),
                            "%" + normalizedQuery.Substring(1) + "%"
                        )
                    )

                    // Label
                    || t.TaskLabels.Any(
                        tl => EF.Functions.ILike(
                            tl.Label.Name,
                            pattern
                        )
                    )
                )
            )
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new TaskResultDto(
                t.Id,
                t.Title,
                t.Project.Key + "-" + t.TaskNumber,
                t.Project.Name,
                t.WorkflowStatus.Name,
                t.StatusId
            ))
            .ToListAsync(ct);

        // ---------------------------------------------------------
        // COMMENT SEARCH
        // ---------------------------------------------------------
        var tasksFromComments = await _db.Comments
            .Where(c =>
                accessibleProjectIds.Contains(c.Task.ProjectId) &&
                EF.Functions.ILike(c.Content, pattern)
            )
            .Select(c => new TaskResultDto(
                c.Task.Id,
                c.Task.Title,
                c.Task.Project.Key + "-" + c.Task.TaskNumber,
                c.Task.Project.Name,
                c.Task.WorkflowStatus.Name,
                c.Task.StatusId
            ))
            .Distinct()
            .Take(5)
            .ToListAsync(ct);

        // ---------------------------------------------------------
        // COMBINE TASK RESULTS
        // ---------------------------------------------------------
        var combinedTasks = tasks
            .Concat(tasksFromComments)
            .GroupBy(t => t.Id)
            .Select(g => g.First())
            .Take(10)
            .ToList();

        // ---------------------------------------------------------
        // PROJECT SEARCH
        // ---------------------------------------------------------
        var projects = await _db.Projects
            .Where(p =>
                accessibleProjectIds.Contains(p.Id) &&
                (
                    EF.Functions.ILike(p.Name, pattern) ||
                    EF.Functions.ILike(p.Key, pattern)
                )
            )
            .Take(5)
            .Select(p => new ProjectResultDto(
                p.Id,
                p.Name,
                p.Key
            ))
            .ToListAsync(ct);

        // ---------------------------------------------------------
        // USER SEARCH
        // ---------------------------------------------------------
        var accessibleUserIds = await _db.ProjectMembers
            .Where(m => accessibleProjectIds.Contains(m.ProjectId))
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync(ct);

        var users = await _db.Users
            .Where(u =>
                u.IsActive &&
                accessibleUserIds.Contains(u.Id) &&
                (
                    EF.Functions.ILike(u.Name, pattern) ||
                    EF.Functions.ILike(u.Email, pattern)
                )
            )
            .Take(5)
            .Select(u => new UserResultDto(
                u.Id,
                u.Name,
                u.Email
            ))
            .ToListAsync(ct);

        return new SearchResultsDto(
            combinedTasks,
            projects,
            users
        );
    }
}