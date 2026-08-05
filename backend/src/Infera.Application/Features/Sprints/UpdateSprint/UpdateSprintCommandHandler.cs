using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Sprints.UpdateSprint;

public class UpdateSprintCommandHandler : IRequestHandler<UpdateSprintCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public UpdateSprintCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(UpdateSprintCommand request, CancellationToken ct)
    {
        var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sprint.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu sprinti düzenleme yetkiniz yok.");

        if (request.EndDate <= request.StartDate)
            throw new InvalidOperationException("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");

        sprint.Name = request.Name;
        sprint.Goal = request.Goal;
        sprint.StartDate = request.StartDate;
        sprint.EndDate = request.EndDate;

        await _db.SaveChangesAsync(ct);
    }
}