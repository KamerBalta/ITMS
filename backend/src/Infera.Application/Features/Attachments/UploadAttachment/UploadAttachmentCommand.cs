using MediatR;

namespace Infera.Application.Features.Attachments.UploadAttachment;

public record UploadAttachmentCommand(
    Guid TaskId, Guid UploadedBy, Stream FileStream, string FileName, long FileSize) : IRequest<Guid>;