using MediatR;

namespace Infera.Application.Features.Attachments.UploadAttachment;

public record UploadAttachmentCommand(
    Guid TaskId,
    Guid UploadedBy,
    Stream FileStream,
    string FileName,
    long FileSize,
    string ContentType
) : IRequest<Guid>, IDisposable
{
    public void Dispose()
    {
        FileStream?.Dispose();
    }
}