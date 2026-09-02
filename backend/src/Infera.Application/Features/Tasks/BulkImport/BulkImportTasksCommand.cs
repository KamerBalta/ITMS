using MediatR;

namespace Infera.Application.Features.Tasks.BulkImport;

public record BulkImportTasksCommand(Guid ProjectId, List<ImportRowDto> Rows) : IRequest<BulkImportResultDto>;

// TempKey: kullanicinin CSV'de kendi verdigi gecici referans (orn. "1", "2") -- ayni
public record ImportRowDto(
    string TempKey, string IssueTypeName, string Title, string? Description,
    string? Priority, string? AssigneeEmail, string? ParentTempKey, int? StoryPoint);

public record BulkImportResultDto(int SuccessCount, int FailCount, List<ImportRowError> Errors);
public record ImportRowError(string TempKey, string Message);