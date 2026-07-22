using MediatR;

namespace Infera.Application.Features.Comments.DeleteComment;

public record DeleteCommentCommand(Guid CommentId) : IRequest;