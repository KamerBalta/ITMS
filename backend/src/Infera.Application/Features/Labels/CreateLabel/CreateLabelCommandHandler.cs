using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Labels.CreateLabel;

public class CreateLabelCommandHandler : IRequestHandler<CreateLabelCommand, Guid>
{
    private readonly IAppDbContext _db;
    public CreateLabelCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<Guid> Handle(CreateLabelCommand request, CancellationToken ct)
    {
        var exists = await _db.Labels.AnyAsync(l => l.Name == request.Name, ct);
        if (exists)
            throw new InvalidOperationException("Bu isimde bir etiket zaten mevcut.");

        var label = new Label { Name = request.Name, Color = request.Color };
        _db.Labels.Add(label);
        await _db.SaveChangesAsync(ct);

        return label.Id;
    }
}