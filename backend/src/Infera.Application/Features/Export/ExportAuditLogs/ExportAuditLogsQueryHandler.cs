using ClosedXML.Excel;
using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Export.ExportAuditLogs;

public class ExportAuditLogsQueryHandler : IRequestHandler<ExportAuditLogsQuery, byte[]>
{
    private readonly IAppDbContext _db;
    public ExportAuditLogsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<byte[]> Handle(ExportAuditLogsQuery request, CancellationToken ct)
    {
        var logs = await _db.AuditLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(5000) // makul bir ust sinir -- cok buyuk exportlar timeout'a sebep olmasin
            .Select(l => new { l.CreatedAt, UserName = l.User.Name, l.Action, l.IpAddress })
            .ToListAsync(ct);

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("AuditLogs");

        sheet.Cell(1, 1).Value = "Tarih";
        sheet.Cell(1, 2).Value = "Kullanıcı";
        sheet.Cell(1, 3).Value = "İşlem";
        sheet.Cell(1, 4).Value = "IP Adresi";
        sheet.Range(1, 1, 1, 4).Style.Font.Bold = true;

        for (int i = 0; i < logs.Count; i++)
        {
            var row = i + 2;
            var l = logs[i];
            sheet.Cell(row, 1).Value = l.CreatedAt;
            sheet.Cell(row, 2).Value = l.UserName;
            sheet.Cell(row, 3).Value = l.Action;
            sheet.Cell(row, 4).Value = l.IpAddress ?? "-";
        }

        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}