namespace Infera.Application.Common.Interfaces;

public record AzureDevOpsChange(string ChangeId, string Message, string Author);
public record AzureDevOpsReleaseInfo(int? PrimaryBuildId, string Environment, string Version);

public interface IAzureDevOpsApiClient
{
    // #TFVC-Real: bir build'in GERCEKTEN icerdigi degisiklikleri (commit/changeset) doner --
    // Jira'nin Development panel'inin yaptigi tam olarak budur: tahmin degil, gercek sorgu.
    Task<List<AzureDevOpsChange>> GetBuildChangesAsync(string orgUrl, string projectName, int buildId, string pat, CancellationToken ct = default);

    // Bir release'in hangi build'e (dolayisiyla hangi degisikliklere) karsilik geldigini bulur.
    Task<AzureDevOpsReleaseInfo?> GetReleaseInfoAsync(string orgUrl, string projectName, int releaseId, string environmentName, string pat, CancellationToken ct = default);
}