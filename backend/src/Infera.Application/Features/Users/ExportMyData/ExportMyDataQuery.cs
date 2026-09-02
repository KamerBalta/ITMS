using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.ExportMyData;

public record ExportMyDataQuery : IRequest<MyDataExportDto>;

public record MyDataExportDto(
    string Email, string Name, DateTime CreatedAt,
    List<MyTaskExportDto> AssignedTasks, List<MyCommentExportDto> Comments);

public record MyTaskExportDto(string IssueKey, string Title, string ProjectName, DateTime CreatedAt);
public record MyCommentExportDto(string TaskTitle, string Content, DateTime CreatedAt);

public class ExportMyDataQueryHandler : IRequestHandler<ExportMyDataQuery, MyDataExportDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public ExportMyDataQueryHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<MyDataExportDto> Handle(ExportMyDataQuery request, CancellationToken ct)
    {
        var user = await _db.Users.FirstAsync(u => u.Id == _currentUser.UserId, ct);

        var tasks = await _db.Tasks
            .Where(t => t.AssigneeId == _currentUser.UserId)
            .Select(t => new MyTaskExportDto(t.Project.Key + "-" + t.TaskNumber, t.Title, t.Project.Name, t.CreatedAt))
            .ToListAsync(ct);

        var comments = await _db.Comments
            .Where(c => c.UserId == _currentUser.UserId)
            .Select(c => new MyCommentExportDto(c.Task.Title, c.Content, c.CreatedAt))
            .ToListAsync(ct);

        return new MyDataExportDto(user.Email, user.Name, user.CreatedAt, tasks, comments);
    }
}