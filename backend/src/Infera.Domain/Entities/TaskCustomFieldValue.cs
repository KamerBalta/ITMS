using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class TaskCustomFieldValue : BaseEntity
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public Guid CustomFieldDefinitionId { get; set; }
    public CustomFieldDefinition CustomFieldDefinition { get; set; } = default!;

    public string Value { get; set; } = default!; // her tur icin string olarak saklanir, frontend tur'a gore parse eder
}