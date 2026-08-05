using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Retrospective.GetRetrospectiveNotes;

public class GetRetrospectiveNotesQueryHandler : IRequestHandler<GetRetrospectiveNotesQuery, List<RetrospectiveNoteDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetRetrospectiveNotesQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<RetrospectiveNoteDto>> Handle(GetRetrospectiveNotesQuery request, CancellationToken ct)
    {
        var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sprint.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu sprinte erişim yetkiniz yok.");

        return await _db.RetrospectiveNotes
            .Where(n => n.SprintId == request.SprintId)
            .OrderBy(n => n.CreatedAt)
            .Select(n => new RetrospectiveNoteDto(n.Id, n.User.Name, n.Category, n.Content, n.IsResolved, n.CreatedAt))
            .ToListAsync(ct);
    }
}