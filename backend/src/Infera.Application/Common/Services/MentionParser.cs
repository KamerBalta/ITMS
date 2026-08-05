using System.Text.RegularExpressions;

namespace Infera.Application.Common.Services;

public static class MentionParser
{
    private static readonly Regex Pattern = new(@"@\[[^\]]+\]\(([0-9a-fA-F\-]{36})\)", RegexOptions.Compiled);

    public static HashSet<Guid> ExtractMentionedUserIds(string? content)
    {
        if (string.IsNullOrEmpty(content)) return new HashSet<Guid>();

        return Pattern.Matches(content)
            .Select(m => Guid.TryParse(m.Groups[1].Value, out var id) ? id : (Guid?)null)
            .Where(id => id is not null)
            .Select(id => id!.Value)
            .ToHashSet();
    }
}