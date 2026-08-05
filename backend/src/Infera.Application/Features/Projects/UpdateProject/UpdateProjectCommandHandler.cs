using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.UpdateProject;

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateProjectCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(UpdateProjectCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!_currentUser.IsAdmin && project.OwnerId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projeyi güncelleme yetkiniz yok.");

        project.Name = request.Name;
        project.Description = request.Description;
        project.StartDate = request.StartDate;
        project.EndDate = request.EndDate;

        await _db.SaveChangesAsync(ct);
    }
}