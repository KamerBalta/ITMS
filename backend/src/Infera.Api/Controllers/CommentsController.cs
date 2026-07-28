using Infera.Application.Features.Comments.AddComment;
using Infera.Application.Features.Comments.DeleteComment;
using Infera.Application.Features.Comments.GetComments;
using Infera.Application.Features.Comments.UpdateComment;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks/{taskId}/comments")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommentsController(IMediator mediator) => _mediator = mediator;


    [HttpGet]
    public async Task<IActionResult> GetAll(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(new GetCommentsQuery(taskId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }


    [HttpPost]
    public async Task<IActionResult> Add(Guid taskId, AddCommentRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);

        try
        {
            var id = await _mediator.Send(
                new AddCommentCommand(
                    taskId,
                    userId,
                    request.Content));

            return CreatedAtAction(
                nameof(GetAll),
                new { taskId },
                new { id });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }


    [HttpPut("{commentId}")]
    public async Task<IActionResult> Update(
        Guid taskId,
        Guid commentId,
        UpdateCommentRequest request)
    {
        try
        {
            await _mediator.Send(
                new UpdateCommentCommand(
                    commentId,
                    request.Content));

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }


    [HttpDelete("{commentId}")]
    public async Task<IActionResult> Delete(
        Guid taskId,
        Guid commentId)
    {
        try
        {
            await _mediator.Send(
                new DeleteCommentCommand(commentId));

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }
}


public record AddCommentRequest(string Content);

public record UpdateCommentRequest(string Content);