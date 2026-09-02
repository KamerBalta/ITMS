namespace Infera.Application.Common.Interfaces;

public interface IFieldAuditLogger
{
    System.Threading.Tasks.Task LogFieldChangeAsync(
        string entityType, Guid entityId, string fieldName, string? oldValue, string? newValue, CancellationToken ct = default);
}