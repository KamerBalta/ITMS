using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Attachments.DownloadAttachment;

public class DownloadAttachmentQueryHandler : IRequestHandler<DownloadAttachmentQuery, DownloadAttachmentResult>
{
    private readonly IAppDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly IProjectAccessService _access;

    public DownloadAttachmentQueryHandler(IAppDbContext db, IFileStorageService storage, IProjectAccessService access)
    {
        _db = db;
        _storage = storage;
        _access = access;
    }

    public async System.Threading.Tasks.Task<DownloadAttachmentResult> Handle(DownloadAttachmentQuery request, CancellationToken ct)
    {
        var attachment = await _db.Attachments.FirstOrDefaultAsync(a => a.Id == request.AttachmentId, ct)
            ?? throw new KeyNotFoundException("Dosya bulunamadı.");

        if (!await _access.HasTaskAccessAsync(attachment.TaskId, ct))
            throw new UnauthorizedAccessException("Bu dosyaya erişim yetkiniz yok.");

        var stream = _storage.GetFileStream(attachment.FilePath);
        return new DownloadAttachmentResult(stream, attachment.FileName);
    }
}