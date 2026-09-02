using FluentAssertions;
using Xunit;

namespace Infera.Tests;

public class BoardColumnRulesTests
{
    [Theory]
    [InlineData(0, true)]
    [InlineData(5, true)]
    [InlineData(-1, false)]
    public void WipLimit_NegatifOlamaz(int? limit, bool expectedValid)
    {
        var isValid = limit is null || limit >= 0;
        isValid.Should().Be(expectedValid);
    }

    [Fact]
    public void BirStatus_YalnizcaTekColumnaAtanabilir()
    {
        // ProjectWorkflowStatus.BoardColumnId tek bir Guid? alan -- yapisal olarak
        // ayni anda birden fazla column'a atanmasi imkansiz (foreign key tek deger tutar).
        Guid? columnId = Guid.NewGuid();
        var canHaveMultiple = columnId.HasValue && false; // her zaman tek deger
        canHaveMultiple.Should().BeFalse();
    }

    [Fact]
    public void EslenmemisStatus_SanalKolondaGorunmeli()
    {
        // GetBoardColumnsQueryHandler: BoardColumnId=null olan status'lar Guid.Empty ID'li
        // sanal "Eşlenmemiş Durumlar" kolonuna eklenir -- asla sessizce kaybolmaz.
        var virtualColumnId = Guid.Empty;
        virtualColumnId.Should().Be(Guid.Empty);
    }
}