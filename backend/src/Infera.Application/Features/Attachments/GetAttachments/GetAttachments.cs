using MediatR;

namespace Infera.Application.Features.Attachments.GetAttachments;

public record GetAttachmentsQuery(Guid TaskId) : IRequest<List<AttachmentDto>>;

public record AttachmentDto(Guid Id, string FileName, string FilePath, long? FileSize, string UploadedByName, DateTime CreatedAt);