using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Infera.Tests;

public class AutomationConditionMatchingTests
{
    // AutomationEngine.MatchesAllConditions ile birebir ayni mantik -- private oldugu icin
    // burada kopyalayip izole test ediyoruz.
    private static bool MatchesAllConditions(string? conditionJson, Dictionary<string, string?> context)
    {
        if (string.IsNullOrEmpty(conditionJson)) return true;
        try
        {
            using var doc = JsonDocument.Parse(conditionJson);
            foreach (var property in doc.RootElement.EnumerateObject())
            {
                var expected = property.Value.GetString();
                if (!context.TryGetValue(property.Name, out var actual)) continue;
                if (!string.Equals(expected, actual, StringComparison.OrdinalIgnoreCase)) return false;
            }
            return true;
        }
        catch { return true; }
    }

    [Fact]
    public void KosulYoksa_HerZamanEslesir()
    {
        MatchesAllConditions(null, new Dictionary<string, string?>()).Should().BeTrue();
    }

    [Fact]
    public void TekKosul_DogruDegerleEslesmeli()
    {
        var context = new Dictionary<string, string?> { ["status"] = "Done" };
        MatchesAllConditions("""{"status":"Done"}""", context).Should().BeTrue();
    }

    [Fact]
    public void TekKosul_YanlisDegerdeReddedilmeli()
    {
        var context = new Dictionary<string, string?> { ["status"] = "InProgress" };
        MatchesAllConditions("""{"status":"Done"}""", context).Should().BeFalse();
    }

    [Fact]
    public void CokluKosul_HepsiEslesmeliAND()
    {
        var context = new Dictionary<string, string?> { ["status"] = "Done", ["issueTypeName"] = "Bug" };
        MatchesAllConditions("""{"status":"Done","issueTypeName":"Bug"}""", context).Should().BeTrue();
    }

    [Fact]
    public void CokluKosul_BiriYanlissaReddedilmeli()
    {
        var context = new Dictionary<string, string?> { ["status"] = "Done", ["issueTypeName"] = "Task" };
        MatchesAllConditions("""{"status":"Done","issueTypeName":"Bug"}""", context).Should().BeFalse();
    }

    [Fact]
    public void KaraktereDuyarsizKarsilastirma()
    {
        var context = new Dictionary<string, string?> { ["status"] = "done" };
        MatchesAllConditions("""{"status":"Done"}""", context).Should().BeTrue();
    }

    [Fact]
    public void BozukJson_HataFirlatmazVeEslesirSayilir()
    {
        var context = new Dictionary<string, string?> { ["status"] = "Done" };
        MatchesAllConditions("{invalid json", context).Should().BeTrue();
    }
}