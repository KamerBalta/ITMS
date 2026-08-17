using Infera.Application.Features.Tasks.CreateSubtask;
using Infera.Application.Features.Tasks.CreateTask;
using Infera.Application.Features.Tasks.CloseEpic;
using Infera.Application.Features.Tasks.DeleteTask;
using Infera.Application.Features.Tasks.GetTaskById;
using Infera.Application.Features.Tasks.GetTasks;
using Infera.Application.Features.Tasks.MoveToSprint;
using Infera.Application.Features.Tasks.UpdateTaskField;
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
        [FromQuery] string? status,
        [FromQuery] Guid? issueTypeId,
        [FromQuery] Priority? priority,
        [FromQuery] string? search,
        [FromQuery] Guid? parentTaskId,
        [FromQuery] Guid? labelId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var result = await _mediator.Send(new GetTasksQuery(
                projectId, sprintId, backlogOnly, assigneeId, status, issueTypeId, priority, search, parentTaskId, labelId, page, pageSize));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpGet("{taskId}")]
    public async Task<IActionResult> GetById(Guid taskId)
    {
        try
        {
            var result = await _mediator.Send(new GetTaskByIdQuery(taskId));
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTaskRequest request)
    {
        var reporterId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            var id = await _mediator.Send(new CreateTaskCommand(
                request.ProjectId, request.SprintId, request.ParentTaskId, request.IssueTypeId,
                request.Title, request.Description, request.Priority, request.StoryPoint,
                request.AssigneeId, reporterId, request.DueDate, request.ComponentIds, request.CustomFieldValues));
            return CreatedAtAction(nameof(GetById), new { taskId = id }, new { id });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPost("{taskId}/subtasks")]
    public async Task<IActionResult> CreateSubtask(Guid taskId, CreateSubtaskRequest request)
    {
        var reporterId = Guid.Parse(User.FindFirstValue("sub")!);
        try
        {
            var id = await _mediator.Send(new CreateSubtaskCommand(taskId, request.Title, reporterId, request.AssigneeId));
            return CreatedAtAction(nameof(GetById), new { taskId = id }, new { id });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/title")]
    public async Task<IActionResult> UpdateTitle(Guid taskId, UpdateTitleRequest request)
    {
        try { await _mediator.Send(new UpdateTaskTitleCommand(taskId, request.Title)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/description")]
    public async Task<IActionResult> UpdateDescription(Guid taskId, UpdateDescriptionRequest request)
    {
        try { await _mediator.Send(new UpdateTaskDescriptionCommand(taskId, request.Description)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/priority")]
    public async Task<IActionResult> UpdatePriority(Guid taskId, UpdatePriorityRequest request)
    {
        try { await _mediator.Send(new UpdateTaskPriorityCommand(taskId, request.Priority)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/story-point")]
    public async Task<IActionResult> UpdateStoryPoint(Guid taskId, UpdateStoryPointRequest request)
    {
        try { await _mediator.Send(new UpdateTaskStoryPointCommand(taskId, request.StoryPoint)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{taskId}/due-date")]
    public async Task<IActionResult> UpdateDueDate(Guid taskId, UpdateDueDateRequest request)
    {
        try { await _mediator.Send(new UpdateTaskDueDateCommand(taskId, request.DueDate)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
    [HttpPut("{taskId}/estimates")]
    public async Task<IActionResult> UpdateEstimates(Guid taskId, UpdateEstimatesRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateTaskEstimatesCommand(taskId, request.OriginalEstimateMinutes, request.RemainingEstimateMinutes));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    [HttpPut("{taskId}/release")]
    public async Task<IActionResult> UpdateRelease(Guid taskId, UpdateReleaseRequest request)
    {
        try { await _mediator.Send(new UpdateTaskReleaseCommand(taskId, request.ReleaseId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{taskId}")]
    public async Task<IActionResult> Delete(Guid taskId)
    {
        try { await _mediator.Send(new DeleteTaskCommand(taskId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/status")]
    public async Task<IActionResult> UpdateStatus(Guid taskId, UpdateStatusRequest request)
    {
        try
        {
            await _mediator.Send(new Infera.Application.Features.Tasks.UpdateTaskStatus.UpdateTaskStatusCommand(taskId, request.Status));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/sprint")]
    public async Task<IActionResult> MoveToSprint(Guid taskId, MoveToSprintRequest request)
    {
        try { await _mediator.Send(new MoveToSprintCommand(taskId, request.SprintId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}/assignee")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Reassign(Guid taskId, ReassignTaskRequest request)
    {
        try
        {
            await _mediator.Send(new Infera.Application.Features.Tasks.ReassignTask.ReassignTaskCommand(taskId, request.AssigneeId));
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{taskId}/close-epic")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> CloseEpic(Guid taskId)
    {
        try { await _mediator.Send(new CloseEpicCommand(taskId)); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }
}

public record CreateTaskRequest(
    Guid ProjectId,
    Guid? SprintId,
    Guid? ParentTaskId,
    Guid IssueTypeId,
    string Title,
    string? Description,
    Priority Priority,
    int? StoryPoint,
    Guid? AssigneeId,
    DateOnly? DueDate,
    List<Guid>? ComponentIds,
    Dictionary<Guid, string?>? CustomFieldValues);

public record CreateSubtaskRequest(string Title, Guid? AssigneeId);
public record UpdateTitleRequest(string Title);
public record UpdateDescriptionRequest(string? Description);
public record UpdatePriorityRequest(Priority Priority);
public record UpdateStoryPointRequest(int? StoryPoint);
public record UpdateDueDateRequest(DateOnly? DueDate);
public record UpdateReleaseRequest(Guid? ReleaseId);
public record UpdateEstimatesRequest(int? OriginalEstimateMinutes, int? RemainingEstimateMinutes);
public record UpdateStatusRequest(ItemStatus Status);
public record MoveToSprintRequest(Guid? SprintId);
public record ReassignTaskRequest(Guid? AssigneeId);