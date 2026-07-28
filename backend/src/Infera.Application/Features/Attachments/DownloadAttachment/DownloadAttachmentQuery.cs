using MediatR;

namespace Infera.Application.Features.Attachments.DownloadAttachment;

public record DownloadAttachmentQuery(Guid AttachmentId) : IRequest<DownloadAttachmentResult>;

public record DownloadAttachmentResult(Stream FileStream, string FileName);