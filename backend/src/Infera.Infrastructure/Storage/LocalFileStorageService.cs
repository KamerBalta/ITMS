using Infera.Application.Common.Interfaces;

namespace Infera.Infrastructure.Storage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public LocalFileStorageService()
    {
        _basePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(_basePath))
            Directory.CreateDirectory(_basePath);
    }

    public async System.Threading.Tasks.Task<string> SaveAsync(Stream fileStream, string fileName, CancellationToken ct = default)
    {
        var safeFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(_basePath, safeFileName);

        await using var output = File.Create(fullPath);
        await fileStream.CopyToAsync(output, ct);

        return Path.Combine("uploads", safeFileName);
    }

    public Stream GetFileStream(string filePath)
    {
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), filePath);
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("Dosya sunucuda bulunamadı.");

        return File.OpenRead(fullPath);
    }

    public void Delete(string filePath)
    {
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), filePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }
}