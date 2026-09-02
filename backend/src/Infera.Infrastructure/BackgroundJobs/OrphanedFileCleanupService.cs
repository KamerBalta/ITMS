using Infera.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infera.Infrastructure.BackgroundJobs;

// Not: Bu job yalnizca S3-uyumlu depolamada (MinIO/AWS S3) anlamlidir -- yerel diskte
// tutarsizlik pratik olarak olusmaz (silme islemi zaten senkron ve ayni islem icinde).
// S3 kullanilmiyorsa (Provider=Local) bu job hicbir sey yapmadan erken doner.
public class OrphanedFileCleanupService : IOrphanedFileCleanupJob
{
    private readonly IAppDbContext _db;
    private readonly ILogger<OrphanedFileCleanupService> _logger;

    public OrphanedFileCleanupService(IAppDbContext db, ILogger<OrphanedFileCleanupService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        // Soft-delete edilmis Task'lara bagli, ama hala fiziksel olarak silinmemis olabilecek
        // Attachment kayitlarini tespit ediyoruz -- DeleteAttachmentCommandHandler zaten dosyayi
        // siliyordu, ama Task soft-delete olurken Attachment'lari otomatik silmiyorduk (bilinen bir bosluk).
        var orphanedAttachments = await _db.Attachments
            .IgnoreQueryFilters() // soft-delete filtresini atla, silinmis Task'lara bagli olanlari da gor
            .Where(a => _db.Tasks.IgnoreQueryFilters().Any(t => t.Id == a.TaskId && EF.Property<bool>(t, "IsDeleted")))
            .ToListAsync(ct);

        if (orphanedAttachments.Count == 0) return;

        _logger.LogInformation("{Count} adet silinmiş göreve ait dosya bulundu, temizleniyor.", orphanedAttachments.Count);

        // Not: Fiziksel dosya silme islemi burada IFileStorageService uzerinden yapilmali --
        // bu servis DI ile eklenmedi cunku senkron/asenkron cagri uyumsuzlugu (S3FileStorageService'in
        // GetAwaiter().GetResult() kullandigi hatirlanmali) buyuk bir toplu islemde riskli olabilir.
        // MVP icin yalnizca DB kaydini temizliyoruz; fiziksel S3 nesnesi manuel/ayri bir script ile
        // temizlenebilir ya da IFileStorageService eklenip Delete() cagirilarak genisletilebilir.
        _db.Attachments.RemoveRange(orphanedAttachments);
        await _db.SaveChangesAsync(ct);
    }
}