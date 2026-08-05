using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Retrospective.ToggleActionItem;

public class ToggleActionItemCommandHandler : IRequestHandler<ToggleActionItemCommand>
{
    private readonly IAppDbContext _db;
    public ToggleActionItemCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(ToggleActionItemCommand request, CancellationToken ct)
    {
        var note = await _db.RetrospectiveNotes.FirstOrDefaultAsync(n => n.Id == request.NoteId, ct)
            ?? throw new KeyNotFoundException("Not bulunamadı.");

        note.IsResolved = !note.IsResolved;
        await _db.SaveChangesAsync(ct);
    }
}