using ClosedXML.Excel;
using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Export.ExportSprintReport;

public class ExportSprintReportQueryHandler : IRequestHandler<ExportSprintReportQuery, byte[]>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public ExportSprintReportQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<byte[]> Handle(ExportSprintReportQuery request, CancellationToken ct)
    {
        var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sprint.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu sprint raporuna erişim yetkiniz yok.");

        var tasks = await _db.Tasks
            .Where(t => t.SprintId == request.SprintId)
            .Select(t => new
            {
                t.Title,
                IssueType = t.IssueType.ToString(),
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                t.StoryPoint,
                AssigneeName = t.Assignee != null ? t.Assignee.Name : "-"
            })
            .ToListAsync(ct);

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(sprint.Name);

        sheet.Cell(1, 1).Value = "Başlık";
        sheet.Cell(1, 2).Value = "Tip";
        sheet.Cell(1, 3).Value = "Durum";
        sheet.Cell(1, 4).Value = "Öncelik";
        sheet.Cell(1, 5).Value = "Story Point";
        sheet.Cell(1, 6).Value = "Atanan";
        sheet.Range(1, 1, 1, 6).Style.Font.Bold = true;

        for (int i = 0; i < tasks.Count; i++)
        {
            var row = i + 2;
            var t = tasks[i];
            sheet.Cell(row, 1).Value = t.Title;
            sheet.Cell(row, 2).Value = t.IssueType;
            sheet.Cell(row, 3).Value = t.Status;
            sheet.Cell(row, 4).Value = t.Priority;
            sheet.Cell(row, 5).Value = t.StoryPoint ?? 0;
            sheet.Cell(row, 6).Value = t.AssigneeName;
        }

        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}