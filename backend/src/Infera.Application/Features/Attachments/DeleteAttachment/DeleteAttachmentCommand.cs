using MediatR;

namespace Infera.Application.Features.Attachments.DeleteAttachment;

public record DeleteAttachmentCommand(Guid AttachmentId) : IRequest;