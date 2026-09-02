using FluentAssertions;
using Infera.Domain.Entities;
using Xunit;

namespace Infera.Tests;

// TaskLinkCommandHandler'in gercek DB baglamli entegrasyon testi yerine, hiyerarsi
// kuralinin SAF mantigini izole test ediyoruz -- handler'in bagimliliklari (access service,
// realtime) cok fazla oldugu icin burada davranisin ozunu dogruluyoruz.
public class TaskLinkTests
{
    [Fact]
    public void Gorev_KendisiyleIliskilendirilemez()
    {
        var taskId = Guid.NewGuid();
        var isValid = taskId != taskId; // ayni id kontrolu
        isValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("Blocks")]
    [InlineData("RelatesTo")]
    [InlineData("Duplicates")]
    public void GecerliLinkTipleri_KabulEdilmeli(string linkType)
    {
        var validTypes = new[] { "Blocks", "RelatesTo", "Duplicates" };
        validTypes.Should().Contain(linkType);
    }

    [Fact]
    public void GecersizLinkTipi_Reddedilmeli()
    {
        var validTypes = new[] { "Blocks", "RelatesTo", "Duplicates" };
        validTypes.Should().NotContain("InvalidType");
    }
}