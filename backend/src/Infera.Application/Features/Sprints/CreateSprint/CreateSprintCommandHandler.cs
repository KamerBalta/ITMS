using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Sprints.CreateSprint;

public class CreateSprintCommandHandler : IRequestHandler<CreateSprintCommand, Guid>
{
    private readonly IAppDbContext _db;
    public CreateSprintCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<Guid> Handle(CreateSprintCommand request, CancellationToken ct)
    {
        var projectExists = await _db.Projects.AnyAsync(p => p.Id == request.ProjectId, ct);
        if (!projectExists)
            throw new KeyNotFoundException("Proje bulunamadı.");

        if (request.EndDate <= request.StartDate)
            throw new InvalidOperationException("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");

        var sprint = new Sprint
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Goal = request.Goal,

            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),

            Status = SprintStatus.Active
        };

        _db.Sprints.Add(sprint);
        await _db.SaveChangesAsync(ct);

        return sprint.Id;
    }
}