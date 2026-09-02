using Infera.Application.Common.Interfaces;

namespace Infera.Infrastructure.Storage;

public class FileContentValidator : IFileContentValidator
{
    // #Kritik-4: Her izin verilen uzanti icin bilinen magic byte imzalari.
    // Bir dosyanin GERCEK turu, uzantisindan bagimsiz olarak ilk birkac byte'inda kodlanir --
    // bu, "zararli.exe dosyasini zararli.jpg olarak yeniden adlandirip yukle" saldirisini engeller.
    private static readonly Dictionary<string, List<byte[]>> KnownSignatures = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = new() { new byte[] { 0x25, 0x50, 0x44, 0x46 } }, // %PDF
        [".png"] = new() { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } },
        [".jpg"] = new() { new byte[] { 0xFF, 0xD8, 0xFF } },
        [".jpeg"] = new() { new byte[] { 0xFF, 0xD8, 0xFF } },
        [".zip"] = new() { new byte[] { 0x50, 0x4B, 0x03, 0x04 }, new byte[] { 0x50, 0x4B, 0x05, 0x06 } },
        // .docx/.xlsx aslinda ZIP konteynerleridir (Office Open XML formati) -- ayni imzayi tasirlar.
        [".docx"] = new() { new byte[] { 0x50, 0x4B, 0x03, 0x04 } },
        [".xlsx"] = new() { new byte[] { 0x50, 0x4B, 0x03, 0x04 } },
    };

    public async Task<bool> IsContentValidForExtensionAsync(Stream fileStream, string declaredExtension, CancellationToken ct = default)
    {
        if (!KnownSignatures.TryGetValue(declaredExtension, out var signatures))
        {
            // Bilinmeyen/imzasi tanimlanmamis bir uzanti icin (whitelist zaten disinda tutulur,
            // bu bir guvenlik agi) -- burada gecerli sayiyoruz, cunku uzanti whitelist'i zaten
            // BR-011'de ayrica kontrol ediliyor.
            return true;
        }

        var canSeek = fileStream.CanSeek;
        var originalPosition = canSeek ? fileStream.Position : 0;

        try
        {
            var maxSignatureLength = signatures.Max(s => s.Length);
            var buffer = new byte[maxSignatureLength];
            var bytesRead = await fileStream.ReadAsync(buffer.AsMemory(0, maxSignatureLength), ct);

            if (bytesRead < maxSignatureLength) return false;

            return signatures.Any(sig => buffer.Take(sig.Length).SequenceEqual(sig));
        }
        finally
        {
            if (canSeek)
                fileStream.Position = originalPosition; // stream'i baslangica geri sar -- sonraki okuma/yukleme icin bozulmamis olmali
        }
    }
}