using ClosedXML.Excel;
using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Export.ExportBacklog;

public class ExportBacklogQueryHandler : IRequestHandler<ExportBacklogQuery, byte[]>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public ExportBacklogQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<byte[]> Handle(ExportBacklogQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu backlog'a erişim yetkiniz yok.");

        var tasks = await _db.Tasks
            .Where(t => t.ProjectId == request.ProjectId && t.SprintId == null)
            .OrderBy(t => t.Rank)
            .Select(t => new
            {
                t.Title,
                IssueType = t.IssueType != null ? t.IssueType.Name : "-",
                Priority = t.Priority.ToString(),
                t.StoryPoint,
                AssigneeName = t.Assignee != null ? t.Assignee.Name : "-"
            })
            .ToListAsync(ct);

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Backlog");

        sheet.Cell(1, 1).Value = "Başlık";
        sheet.Cell(1, 2).Value = "Tip";
        sheet.Cell(1, 3).Value = "Öncelik";
        sheet.Cell(1, 4).Value = "Story Point";
        sheet.Cell(1, 5).Value = "Atanan";
        sheet.Range(1, 1, 1, 5).Style.Font.Bold = true;

        for (int i = 0; i < tasks.Count; i++)
        {
            var row = i + 2;
            var t = tasks[i];
            sheet.Cell(row, 1).Value = t.Title;
            sheet.Cell(row, 2).Value = t.IssueType;
            sheet.Cell(row, 3).Value = t.Priority;
            sheet.Cell(row, 4).Value = t.StoryPoint ?? 0;
            sheet.Cell(row, 5).Value = t.AssigneeName;
        }

        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}