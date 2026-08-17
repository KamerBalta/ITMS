using FluentAssertions;
using Infera.Domain.Entities;
using Xunit;

namespace Infera.Tests;

// Bu testler CreateTaskCommandHandler'in tam entegrasyonunu kurmak yerine, zorunlu alan
// kontrolunun ayni mantigini izole olarak dogruluyor -- gercek handler cok fazla bagimliliga
// (notification, realtime, automation) sahip oldugu icin burada saf mantigi test ediyoruz.
public class CustomFieldValidationTests
{
    private static bool AllRequiredFieldsProvided(
     List<CustomFieldDefinition> fields,
     Dictionary<Guid, string?> providedValues)
    {
        foreach (var field in fields)
        {
            if (!field.IsRequired)
                continue;

            if (!providedValues.TryGetValue(field.Id, out var value) ||
                string.IsNullOrWhiteSpace(value))
            {
                return false;
            }
        }

        return true;
    }

    [Fact]
    public void ZorunluAlan_BosBirakilirsa_GecersizOlmali()
    {
        var field = new CustomFieldDefinition { Id = Guid.NewGuid(), Name = "Müşteri No", IsRequired = true, FieldType = "text" };
        var provided = new Dictionary<Guid, string?>();

        var isValid = AllRequiredFieldsProvided(new List<CustomFieldDefinition> { field }, provided);

        isValid.Should().BeFalse();
    }

    [Fact]
    public void ZorunluAlan_SadeceBosluklaDoldurulursa_GecersizOlmali()
    {
        var field = new CustomFieldDefinition { Id = Guid.NewGuid(), Name = "Müşteri No", IsRequired = true, FieldType = "text" };
        var provided = new Dictionary<Guid, string?> { [field.Id] = "   " };

        var isValid = AllRequiredFieldsProvided(new List<CustomFieldDefinition> { field }, provided);

        isValid.Should().BeFalse();
    }

    [Fact]
    public void ZorunluAlan_DoldurulursaGecerliOlmali()
    {
        var field = new CustomFieldDefinition { Id = Guid.NewGuid(), Name = "Müşteri No", IsRequired = true, FieldType = "text" };
        var provided = new Dictionary<Guid, string?> { [field.Id] = "12345" };

        var isValid = AllRequiredFieldsProvided(new List<CustomFieldDefinition> { field }, provided);

        isValid.Should().BeTrue();
    }

    [Fact]
    public void ZorunluOlmayanAlan_BosBirakilabilir()
    {
        var field = new CustomFieldDefinition { Id = Guid.NewGuid(), Name = "Not", IsRequired = false, FieldType = "text" };
        var provided = new Dictionary<Guid, string?>();

        var isValid = AllRequiredFieldsProvided(new List<CustomFieldDefinition> { field }, provided);

        isValid.Should().BeTrue();
    }
}