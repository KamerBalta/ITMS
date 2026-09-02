namespace Infera.Application.Common.Interfaces;

public interface IFileContentValidator
{
    // Dosyanin BEYAN EDILEN uzantisi (orn. ".pdf") ile gercek icerigi (magic bytes)
    // birbirine uyuyor mu diye kontrol eder. Uymuyorsa dosya reddedilmeli.
    Task<bool> IsContentValidForExtensionAsync(Stream fileStream, string declaredExtension, CancellationToken ct = default);
}