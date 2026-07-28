using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Labels.UpdateLabel;

public class UpdateLabelCommandHandler : IRequestHandler<UpdateLabelCommand>
{
    private readonly IAppDbContext _db;
    public UpdateLabelCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(UpdateLabelCommand request, CancellationToken ct)
    {
        var label = await _db.Labels.FirstOrDefaultAsync(l => l.Id == request.LabelId, ct)
            ?? throw new KeyNotFoundException("Etiket bulunamadı.");

        var nameConflict = await _db.Labels.AnyAsync(l => l.Name == request.Name && l.Id != request.LabelId, ct);
        if (nameConflict)
            throw new InvalidOperationException("Bu isimde başka bir etiket zaten mevcut.");

        label.Name = request.Name;
        label.Color = request.Color;

        await _db.SaveChangesAsync(ct);
    }
}