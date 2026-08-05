using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Retrospective.AddRetrospectiveNote;

public class AddRetrospectiveNoteCommandHandler : IRequestHandler<AddRetrospectiveNoteCommand, Guid>
{
    private static readonly HashSet<string> ValidCategories = new() { "WentWell", "WentWrong", "ActionItem" };
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public AddRetrospectiveNoteCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(AddRetrospectiveNoteCommand request, CancellationToken ct)
    {
        var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sprint.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu sprinte erişim yetkiniz yok.");

        if (!ValidCategories.Contains(request.Category))
            throw new InvalidOperationException("Geçersiz kategori.");

        var note = new RetrospectiveNote
        {
            SprintId = request.SprintId,
            UserId = request.UserId,
            Category = request.Category,
            Content = request.Content,
        };

        _db.RetrospectiveNotes.Add(note);
        await _db.SaveChangesAsync(ct);

        return note.Id;
    }
}