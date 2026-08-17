using Amazon.S3;
using Amazon.S3.Model;
using Infera.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Infera.Infrastructure.Storage;

public class S3FileStorageService : IFileStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public S3FileStorageService(IConfiguration config)
    {
        _bucketName = config["Storage:S3BucketName"]!;

        var s3Config = new AmazonS3Config
        {
            ServiceURL = config["Storage:S3Endpoint"],
            ForcePathStyle = true, // MinIO ve pek cok S3-uyumlu servis icin gerekli (virtual-hosted style yerine path style)
        };

        _s3Client = new AmazonS3Client(config["Storage:S3AccessKey"], config["Storage:S3SecretKey"], s3Config);
    }

    public async System.Threading.Tasks.Task<string> SaveAsync(Stream fileStream, string fileName, CancellationToken ct = default)
    {
        var key = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = fileStream,
            AutoCloseStream = false,
        };

        await _s3Client.PutObjectAsync(request, ct);

        // Onceki yerel depolama "uploads/xxx" formatinda relative path donduruyordu --
        // ayni sozlesmeyi koruyoruz ki DB'deki FilePath alaninin anlami tutarli kalsin.
        return $"s3://{key}";
    }

    public Stream GetFileStream(string filePath)
    {
        var key = ExtractKey(filePath);

        var request = new GetObjectRequest { BucketName = _bucketName, Key = key };
        var response = _s3Client.GetObjectAsync(request).GetAwaiter().GetResult();

        return response.ResponseStream;
    }

    public void Delete(string filePath)
    {
        var key = ExtractKey(filePath);
        _s3Client.DeleteObjectAsync(_bucketName, key).GetAwaiter().GetResult();
    }

    private static string ExtractKey(string filePath) =>
        filePath.StartsWith("s3://") ? filePath["s3://".Length..] : filePath;
}