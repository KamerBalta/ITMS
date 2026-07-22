using MediatR;

namespace Infera.Application.Features.Comments.GetComments;

public record GetCommentsQuery(Guid TaskId) : IRequest<List<CommentDto>>;

public record CommentDto(Guid Id, string UserName, string Content, DateTime CreatedAt, bool IsOwner);