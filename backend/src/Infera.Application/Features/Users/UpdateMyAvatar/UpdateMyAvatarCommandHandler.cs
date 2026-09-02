using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.UpdateMyAvatar;

public class UpdateMyAvatarCommandHandler : IRequestHandler<UpdateMyAvatarCommand, string>
{
    private readonly IAppDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly IFileContentValidator _contentValidator;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase) { ".png", ".jpg", ".jpeg" };
    private const long MaxAvatarSizeBytes = 5 * 1024 * 1024; // 5 MB -- normal dosyalardan (25MB) daha kucuk bir limit yeterli

    public UpdateMyAvatarCommandHandler(
        IAppDbContext db,
        IFileStorageService storage,
        IFileContentValidator contentValidator)
    {
        _db = db;
        _storage = storage;
        _contentValidator = contentValidator;
    }

    public async System.Threading.Tasks.Task<string> Handle(UpdateMyAvatarCommand request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        var extension = Path.GetExtension(request.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            throw new InvalidOperationException("Avatar yalnızca PNG veya JPG formatında olabilir.");

        // #Kritik-4: Uzantı kontrolünün yanı sıra dosyanın gerçek bayt içeriğini doğrula
        var isContentValid = await _contentValidator.IsContentValidForExtensionAsync(request.FileStream, extension, ct);
        if (!isContentValid)
            throw new InvalidOperationException("Yüklenen dosya geçerli bir resim dosyası değil.");

        if (request.FileStream.Length > MaxAvatarSizeBytes)
            throw new InvalidOperationException("Avatar dosyası 5 MB sınırını aşıyor.");

        // Eski avatar varsa diskten temizle
        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            try { _storage.Delete(user.AvatarUrl); } catch { /* eski dosya zaten yoksa sessizce gec */ }
        }

        var filePath = await _storage.SaveAsync(request.FileStream, request.FileName, ct);
        user.AvatarUrl = filePath;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return filePath;
    }
}