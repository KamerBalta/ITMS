using MediatR;

namespace Infera.Application.Features.Comments.UpdateComment;

public record UpdateCommentCommand(Guid CommentId, string Content) : IRequest;