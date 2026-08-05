namespace Infera.Application.Common.Interfaces;

public interface IFileStorageService
{
    System.Threading.Tasks.Task<string> SaveAsync(Stream fileStream, string fileName, CancellationToken ct = default);
    Stream GetFileStream(string filePath);
    void Delete(string filePath);
}