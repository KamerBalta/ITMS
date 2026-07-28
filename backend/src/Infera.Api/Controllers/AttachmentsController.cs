using Infera.Application.Features.Attachments.DeleteAttachment;
using Infera.Application.Features.Attachments.GetAttachments;
using Infera.Application.Features.Attachments.UploadAttachment;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Infera.Application.Features.Attachments.DownloadAttachment;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks/{taskId}/attachments")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AttachmentsController(IMediator mediator) => _mediator = mediator;


    [HttpGet]
    public async Task<IActionResult> GetAll(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(
                new GetAttachmentsQuery(taskId));

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
    [RequestSizeLimit(30 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        Guid taskId,
        IFormFile file)
    {
        var userId = Guid.Parse(User.FindFirstValue("sub")!);

        try
        {
            await using var stream = file.OpenReadStream();

            var id = await _mediator.Send(
                new UploadAttachmentCommand(
                    taskId,
                    userId,
                    stream,
                    file.FileName,
                    file.Length));

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

    [HttpGet("{attachmentId}/download")]
    public async Task<IActionResult> Download(Guid taskId, Guid attachmentId)
    {
        try
        {
            var result = await _mediator.Send(new DownloadAttachmentQuery(attachmentId));
            return File(result.FileStream, "application/octet-stream", result.FileName);
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

    [HttpDelete("{attachmentId}")]
    public async Task<IActionResult> Delete(
        Guid taskId,
        Guid attachmentId)
    {
        try
        {
            await _mediator.Send(
                new DeleteAttachmentCommand(attachmentId));

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