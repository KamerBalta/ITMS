using MediatR;

namespace Infera.Application.Features.Comments.AddComment;

public record AddCommentCommand(Guid TaskId, Guid UserId, string Content) : IRequest<Guid>;