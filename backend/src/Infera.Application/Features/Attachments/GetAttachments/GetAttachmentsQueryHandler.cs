using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Attachments.GetAttachments;

public class GetAttachmentsQueryHandler : IRequestHandler<GetAttachmentsQuery, List<AttachmentDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetAttachmentsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<AttachmentDto>> Handle(GetAttachmentsQuery request, CancellationToken ct)
    {
        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        return await _db.Attachments
            .Where(a => a.TaskId == request.TaskId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AttachmentDto(a.Id, a.FileName, a.FilePath, a.FileSize, a.Uploader.Name, a.CreatedAt))
            .ToListAsync(ct);
    }
}