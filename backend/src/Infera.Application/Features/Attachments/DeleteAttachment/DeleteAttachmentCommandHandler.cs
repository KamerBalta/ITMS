using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Attachments.DeleteAttachment;

public class DeleteAttachmentCommandHandler : IRequestHandler<DeleteAttachmentCommand>
{
    private readonly IAppDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;

    public DeleteAttachmentCommandHandler(
        IAppDbContext db, IFileStorageService storage, ICurrentUserService currentUser, IProjectAccessService access)
    {
        _db = db;
        _storage = storage;
        _currentUser = currentUser;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(DeleteAttachmentCommand request, CancellationToken ct)
    {
        var attachment = await _db.Attachments.FirstOrDefaultAsync(a => a.Id == request.AttachmentId, ct)
            ?? throw new KeyNotFoundException("Dosya bulunamadı.");

        if (!await _access.HasTaskAccessAsync(attachment.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        if (attachment.UploadedBy != _currentUser.UserId && !_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Yalnızca kendi yüklediğiniz dosyayı silebilirsiniz.");

        _storage.Delete(attachment.FilePath);
        _db.Attachments.Remove(attachment);
        await _db.SaveChangesAsync(ct);
    }
}