using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Attachments.UploadAttachment;

public class UploadAttachmentCommandHandler : IRequestHandler<UploadAttachmentCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly IProjectAccessService _access;
    private readonly IFileContentValidator _contentValidator;

    private const long MaxFileSizeBytes = 25 * 1024 * 1024;

    // BR-011: Gorevlere yalnizca bu uzantilar yuklenebilir.
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".zip"
    };

    public UploadAttachmentCommandHandler(
        IAppDbContext db,
        IFileStorageService storage,
        IProjectAccessService access,
        IFileContentValidator contentValidator)
    {
        _db = db;
        _storage = storage;
        _access = access;
        _contentValidator = contentValidator;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(UploadAttachmentCommand request, CancellationToken ct)
    {
        var taskExists = await _db.Tasks.AnyAsync(t => t.Id == request.TaskId, ct);
        if (!taskExists)
            throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve dosya yükleme yetkiniz yok.");

        if (request.FileSize > MaxFileSizeBytes)
            throw new InvalidOperationException("Dosya boyutu 25 MB sınırını aşıyor.");

        var extension = Path.GetExtension(request.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            throw new InvalidOperationException(
                "Yalnızca PDF, DOCX, XLSX, PNG, JPG ve ZIP uzantılı dosyalar yüklenebilir.");

        // #Kritik-4: Uzantı whitelist'i (BR-011) yeterli değil -- dosyanın GERÇEK içeriği de
        // beyan edilen uzantıyla eşleşmeli (magic bytes / mime inspection).
        var isContentValid = await _contentValidator.IsContentValidForExtensionAsync(request.FileStream, extension, ct);
        if (!isContentValid)
            throw new InvalidOperationException($"Dosya içeriği, '{extension}' uzantısıyla uyuşmuyor. Dosya bozuk olabilir ya da uzantısı yanlış değiştirilmiş olabilir.");

        var filePath = await _storage.SaveAsync(request.FileStream, request.FileName, ct);

        var attachment = new Attachment
        {
            TaskId = request.TaskId,
            UploadedBy = request.UploadedBy,
            FileName = request.FileName,
            FilePath = filePath,
            FileSize = request.FileSize,
            ContentType = request.ContentType
        };

        _db.Attachments.Add(attachment);
        await _db.SaveChangesAsync(ct);

        return attachment.Id;
    }
}