namespace Infera.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(
        Stream fileStream,
        string fileName,
        CancellationToken ct = default);

    Task<Stream> GetFileStreamAsync(
        string filePath,
        CancellationToken ct = default);

    void Delete(string filePath);
}