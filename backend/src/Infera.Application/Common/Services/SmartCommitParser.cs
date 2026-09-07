using System.Text.RegularExpressions;

namespace Infera.Application.Common.Services;

public record ParsedCommitReference(string IssueKey, string? CommentText, string? StatusCommand, int? TimeSpentMinutes);

public static class SmartCommitParser
{
    private static readonly Regex IssueKeyPattern = new(@"\b([A-Z][A-Z0-9]+-\d+)\b", RegexOptions.Compiled);
    private static readonly Regex CommentPattern = new(@"#comment\s+(.+?)(?=#|$)", RegexOptions.Compiled | RegexOptions.Singleline);
    private static readonly Regex TimePattern = new(@"#time\s+(\d+)([hm])", RegexOptions.Compiled);

    // #2: Artik SADECE #close degil -- commit mesajindaki TUM '#kelime' komutlarini
    // (comment/time HARIC) yakalayip ham string olarak donduruyoruz. Hangisinin gecerli
    // bir workflow gecisi oldugunu KARAR VERMEK bu sinifin isi degil -- cagiran taraf
    // (GitWebhookProcessor), projenin gercek WorkflowTransition tablosuna bakarak karar verir.
    private static readonly Regex GenericCommandPattern = new(@"#([a-z0-9\-]+)\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly HashSet<string> ReservedCommandNames = new(StringComparer.OrdinalIgnoreCase) { "comment", "time" };

    public static List<ParsedCommitReference> Parse(string commitMessage)
    {
        var issueKeys = IssueKeyPattern.Matches(commitMessage).Select(m => m.Groups[1].Value).Distinct().ToList();
        if (issueKeys.Count == 0) return new List<ParsedCommitReference>();

        var commentMatch = CommentPattern.Match(commitMessage);
        var commentText = commentMatch.Success ? commentMatch.Groups[1].Value.Trim() : null;

        int? timeSpentMinutes = null;
        var timeMatch = TimePattern.Match(commitMessage);
        if (timeMatch.Success)
        {
            var value = int.Parse(timeMatch.Groups[1].Value);
            timeSpentMinutes = timeMatch.Groups[2].Value == "h" ? value * 60 : value;
        }

        // #2: "close"/"resolve" gibi eski sabit komutlari geriye donuk uyumluluk icin
        // ozel olarak "Done" kategorisine isaret eden bir alias olarak tutuyoruz, ama
        // asil is #<durum-adi-slug> formatindaki komutlarda -- orn. #in-progress, #qa-ready.
        string? statusCommand = null;
        foreach (Match match in GenericCommandPattern.Matches(commitMessage))
        {
            var commandName = match.Groups[1].Value;
            if (ReservedCommandNames.Contains(commandName)) continue;
            statusCommand = commandName; // birden fazla durum komutu varsa SONUNCUSU gecerli sayilir
        }

        return issueKeys.Select(key => new ParsedCommitReference(key, commentText, statusCommand, timeSpentMinutes)).ToList();
    }

    // "In Progress" -> "in-progress", "QA Ready" -> "qa-ready" gibi normalize eder --
    // hem workflow durum adini hem kullanicinin yazdigi komutu AYNI forma getirip
    // karsilastirabilmek icin.
    public static string SlugifyStatusName(string statusName) =>
        statusName.Trim().ToLowerInvariant().Replace(" ", "-").Replace("/", "-");
}