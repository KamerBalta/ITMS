using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Labels.DeleteLabel;

public class DeleteLabelCommandHandler : IRequestHandler<DeleteLabelCommand>
{
    private readonly IAppDbContext _db;
    public DeleteLabelCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(DeleteLabelCommand request, CancellationToken ct)
    {
        var label = await _db.Labels.FirstOrDefaultAsync(l => l.Id == request.LabelId, ct)
            ?? throw new KeyNotFoundException("Etiket bulunamadı.");

        // Etiket silinince baglantili TaskLabels kayitlari da (hard-delete kapsaminda oldugu icin)
        // manuel temizlenmeli -- aksi halde yetim kayit kalir.
        var links = await _db.TaskLabels.Where(tl => tl.LabelId == request.LabelId).ToListAsync(ct);
        _db.TaskLabels.RemoveRange(links);

        _db.Labels.Remove(label);
        await _db.SaveChangesAsync(ct);
    }
}