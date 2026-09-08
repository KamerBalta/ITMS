using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Infera.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Infera.Infrastructure.Services;

public class AzureDevOpsApiClient : IAzureDevOpsApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AzureDevOpsApiClient> _logger;

    public AzureDevOpsApiClient(HttpClient httpClient, ILogger<AzureDevOpsApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    private static void SetAuth(HttpRequestMessage request, string pat)
    {
        // Azure DevOps PAT auth: kullanici adi bos, sifre PAT -- Basic Auth olarak Base64 encode edilir.
        var authValue = Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authValue);
    }

    public async Task<List<AzureDevOpsChange>> GetBuildChangesAsync(string orgUrl, string projectName, int buildId, string pat, CancellationToken ct = default)
    {
        // GET https://dev.azure.com/{org}/{project}/_apis/build/builds/{buildId}/changes?api-version=7.0
        // Bu endpoint, ONCEKI BASARILI BUILD'DEN BU YANA gelen TUM degisiklikleri (commit/changeset) doner --
        // yani "son 2 saat" gibi bir zaman tahmini YERINE, build'in GERCEKTEN neyi icerdigini soyler.
        var url = $"{orgUrl.TrimEnd('/')}/{Uri.EscapeDataString(projectName)}/_apis/build/builds/{buildId}/changes?api-version=7.0&$top=100";

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            SetAuth(request, pat);
            var response = await _httpClient.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Azure DevOps build changes çağrısı başarısız: {StatusCode} — {Url}", response.StatusCode, url);
                return new List<AzureDevOpsChange>();
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);

            var results = new List<AzureDevOpsChange>();
            if (doc.RootElement.TryGetProperty("value", out var valueArray))
            {
                foreach (var change in valueArray.EnumerateArray())
                {
                    var changeId = change.TryGetProperty("id", out var idEl) ? idEl.GetString() ?? "" : "";
                    var message = change.TryGetProperty("message", out var msgEl) ? msgEl.GetString() ?? "" : "";
                    var author = change.TryGetProperty("author", out var authorEl) && authorEl.TryGetProperty("displayName", out var nameEl)
                        ? nameEl.GetString() ?? "Bilinmeyen" : "Bilinmeyen";

                    if (!string.IsNullOrEmpty(changeId))
                        results.Add(new AzureDevOpsChange(changeId, message, author));
                }
            }
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Azure DevOps build changes çağrısı sırasında hata oluştu.");
            return new List<AzureDevOpsChange>();
        }
    }

    public async Task<AzureDevOpsReleaseInfo?> GetReleaseInfoAsync(string orgUrl, string projectName, int releaseId, string environmentName, string pat, CancellationToken ct = default)
    {
        // Release API farkli bir alt domain kullanir: vsrm.dev.azure.com (build/proje API'leri dev.azure.com'da,
        // release API'leri vsrm.dev.azure.com'da barinir -- Azure DevOps'un kendi mimari ayrimi).
        var releaseOrgUrl = orgUrl.Replace("dev.azure.com", "vsrm.dev.azure.com");
        var url = $"{releaseOrgUrl.TrimEnd('/')}/{Uri.EscapeDataString(projectName)}/_apis/release/releases/{releaseId}?api-version=7.0";

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            SetAuth(request, pat);
            var response = await _httpClient.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Azure DevOps release bilgisi çağrısı başarısız: {StatusCode} — {Url}", response.StatusCode, url);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);

            var releaseName = doc.RootElement.TryGetProperty("name", out var nameEl) ? nameEl.GetString() ?? "" : "";

            // #TFVC-Real: release'in "primary artifact"i genelde bir build'e isaret eder --
            // "artifacts[].definitionReference.version.id" alaninda build ID bulunur.
            // Azure DevOps'un artifact semasi provider'a gore degisebilir (Build, Jenkins, GitHub vb.) --
            // bu yuzden yalnizca "Build" tipindeki artifact'i ariyoruz.
            int? primaryBuildId = null;
            if (doc.RootElement.TryGetProperty("artifacts", out var artifactsArray))
            {
                foreach (var artifact in artifactsArray.EnumerateArray())
                {
                    var artifactType = artifact.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : null;
                    if (artifactType != "Build") continue;

                    if (artifact.TryGetProperty("definitionReference", out var defRef) &&
                        defRef.TryGetProperty("version", out var versionRef) &&
                        versionRef.TryGetProperty("id", out var buildIdEl) &&
                        int.TryParse(buildIdEl.GetString(), out var buildId))
                    {
                        primaryBuildId = buildId;
                        break;
                    }
                }
            }

            return new AzureDevOpsReleaseInfo(primaryBuildId, environmentName, releaseName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Azure DevOps release bilgisi çağrısı sırasında hata oluştu.");
            return null;
        }
    }
}