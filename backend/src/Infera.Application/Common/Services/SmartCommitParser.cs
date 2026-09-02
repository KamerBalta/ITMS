using System.Text.RegularExpressions;

namespace Infera.Application.Common.Services;

public record ParsedCommitReference(string IssueKey, string? CommentText, bool ShouldClose, int? TimeSpentMinutes);

public static class SmartCommitParser
{
    // Issue key formati: PROJ-123 (buyuk harfli proje prefix'i + tire + sayi)
    private static readonly Regex IssueKeyPattern = new(@"\b([A-Z][A-Z0-9]+-\d+)\b", RegexOptions.Compiled);
    private static readonly Regex CommentPattern = new(@"#comment\s+(.+?)(?=#|$)", RegexOptions.Compiled | RegexOptions.Singleline);
    private static readonly Regex TimePattern = new(@"#time\s+(\d+)([hm])", RegexOptions.Compiled);

    // #Git: "ITMS-123 ITMS-124 #comment Fixed the null check #close #time 30m"
    // gibi bir commit mesajini ayristirir. Birden fazla Issue Key referans edilebilir --
    // her biri icin AYNI komutlar (yorum/kapat/zaman) uygulanir.
    public static List<ParsedCommitReference> Parse(string commitMessage)
    {
        var issueKeys = IssueKeyPattern.Matches(commitMessage).Select(m => m.Groups[1].Value).Distinct().ToList();
        if (issueKeys.Count == 0) return new List<ParsedCommitReference>();

        var shouldClose = commitMessage.Contains("#close", StringComparison.OrdinalIgnoreCase)
                        || commitMessage.Contains("#resolve", StringComparison.OrdinalIgnoreCase);

        var commentMatch = CommentPattern.Match(commitMessage);
        var commentText = commentMatch.Success ? commentMatch.Groups[1].Value.Trim() : null;

        int? timeSpentMinutes = null;
        var timeMatch = TimePattern.Match(commitMessage);
        if (timeMatch.Success)
        {
            var value = int.Parse(timeMatch.Groups[1].Value);
            timeSpentMinutes = timeMatch.Groups[2].Value == "h" ? value * 60 : value;
        }

        return issueKeys.Select(key => new ParsedCommitReference(key, commentText, shouldClose, timeSpentMinutes)).ToList();
    }
}