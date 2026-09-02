using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.GetMyTasksBoard;

public record GetMyTasksBoardQuery : IRequest<List<MyTaskBoardItemDto>>;

// #4: farkli projelerin farkli Status/Column yapilari olabilir -- cross-project bir
// Board'da bunlari TEK ORTAK kategoriye (ToDo/InProgress/Done) indirgemek zorundayiz,
// projeye ozel kolon isimlerini degil.
public record MyTaskBoardItemDto(
    Guid Id, string Title, string IssueKey, string ProjectName, Guid ProjectId,
    string StatusName, string StatusCategory, string Priority, string? IssueTypeIcon);

public class GetMyTasksBoardQueryHandler : IRequestHandler<GetMyTasksBoardQuery, List<MyTaskBoardItemDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public GetMyTasksBoardQueryHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<List<MyTaskBoardItemDto>> Handle(GetMyTasksBoardQuery request, CancellationToken ct)
    {
        return await _db.Tasks
            .AsSplitQuery()
            .Where(t => t.AssigneeId == _currentUser.UserId && t.WorkflowStatus.Category != "Done")
            .OrderBy(t => t.Priority)
            .Select(t => new MyTaskBoardItemDto(
                t.Id, t.Title, t.Project.Key + "-" + t.TaskNumber, t.Project.Name, t.ProjectId,
                t.WorkflowStatus.Name, t.WorkflowStatus.Category, t.Priority.ToString(),
                t.IssueType != null ? t.IssueType.Icon : null))
            .Take(200) // #4: makul bir ust sinir -- bir kisinin ayni anda 200'den fazla acik gorevi olmasi zaten anormal bir durum
            .ToListAsync(ct);
    }
}