using Infera.Application.Features.Tasks.CreateTask;
using Infera.Application.Features.Tasks.GetTasks;
using Infera.Application.Features.Tasks.MoveToSprint;
using Infera.Application.Features.Tasks.UpdateTaskStatus;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;
    public TasksController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetTasks(
        [FromQuery] Guid projectId,
        [FromQuery] Guid? sprintId,
        [FromQuery] bool? backlogOnly,
        [FromQuery] Guid? assigneeId,
        [FromQuery] string? status)
    {
        var result = await _mediator.Send(new GetTasksQuery(projectId, sprintId, backlogOnly, assigneeId, status));
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTaskRequest request)
    {
        var reporterId = Guid.Parse(
    User.FindFirstValue(ClaimTypes.NameIdentifier)
    ?? User.FindFirstValue("sub")!
);
        try
        {
            var id = await _mediator.Send(new CreateTaskCommand(
                request.ProjectId, request.SprintId, request.Title, request.Description,
                request.IssueType, request.Priority, request.StoryPoint,
                request.AssigneeId, reporterId, request.DueDate));
            return CreatedAtAction(nameof(GetTasks), new { projectId = request.ProjectId }, new { id });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/status")]
    public async Task<IActionResult> UpdateStatus(Guid taskId, UpdateStatusRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateTaskStatusCommand(taskId, request.Status));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/sprint")]
    public async Task<IActionResult> MoveToSprint(Guid taskId, MoveToSprintRequest request)
    {
        try
        {
            await _mediator.Send(new MoveToSprintCommand(taskId, request.SprintId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public record CreateTaskRequest(
    Guid ProjectId, Guid? SprintId, string Title, string? Description,
    IssueType IssueType, Priority Priority, int? StoryPoint,
    Guid? AssigneeId, DateTime? DueDate);

public record UpdateStatusRequest(ItemStatus Status);
public record MoveToSprintRequest(Guid? SprintId);