using Infera.Application.Features.Tasks.CreateSubtask;
using Infera.Application.Features.Tasks.CreateTask;
using Infera.Application.Features.Tasks.DeleteTask;
using Infera.Application.Features.Tasks.GetTaskById;
using Infera.Application.Features.Tasks.GetTasks;
using Infera.Application.Features.Tasks.MoveToSprint;
using Infera.Application.Features.Tasks.UpdateTask;
using Infera.Application.Features.Tasks.UpdateTaskStatus;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Infera.Application.Features.Tasks.CloseEpic;
using System.Security.Claims;
using Infera.Application.Features.Tasks.ReassignTask;
namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;

    public TasksController(IMediator mediator)
    {
        _mediator = mediator;
    }


  

[HttpGet]
public async Task<IActionResult> GetTasks(
    [FromQuery] Guid projectId,
    [FromQuery] Guid? sprintId,
    [FromQuery] bool? backlogOnly,
    [FromQuery] Guid? assigneeId,
    [FromQuery] string? status,
    [FromQuery] IssueType? issueType,
    [FromQuery] Priority? priority,
    [FromQuery] string? search,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 50)
{
    try
    {
        var result = await _mediator.Send(new GetTasksQuery(
            projectId, sprintId, backlogOnly, assigneeId, status, issueType, priority, search, page, pageSize));
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
            var result = await _mediator.Send(
                new GetTaskByIdQuery(taskId));

            return Ok(result);
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
    [HttpPut("{taskId}/close-epic")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> CloseEpic(Guid taskId)
    {
        try
        {
            await _mediator.Send(new CloseEpicCommand(taskId));
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
        var reporterId = Guid.Parse(
            User.FindFirstValue("sub")!);

        try
        {
            var id = await _mediator.Send(new CreateTaskCommand(
     request.ProjectId, request.SprintId, request.ParentTaskId, request.Title, request.Description,
     request.IssueType, request.Priority, request.StoryPoint,
     request.AssigneeId, reporterId, request.DueDate));

            return CreatedAtAction(
                nameof(GetById),
                new { taskId = id },
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


    [HttpPost("{taskId}/subtasks")]
    public async Task<IActionResult> CreateSubtask(
        Guid taskId,
        CreateSubtaskRequest request)
    {
        var reporterId = Guid.Parse(
            User.FindFirstValue("sub")!);

        try
        {
            var id = await _mediator.Send(
                new CreateSubtaskCommand(
                    taskId,
                    request.Title,
                    reporterId,
                    request.AssigneeId));

            return CreatedAtAction(
                nameof(GetById),
                new { taskId = id },
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


    [HttpPut("{taskId}")]
    public async Task<IActionResult> Update(Guid taskId, UpdateTaskRequest request)
    {
        try
        {
            await _mediator.Send(new UpdateTaskCommand(
                taskId, request.Title, request.Description, request.Priority, request.StoryPoint, request.DueDate));
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
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPut("{taskId}/assignee")]
    [Authorize(Policy = "RequireProjectManager")]
    public async Task<IActionResult> Reassign(Guid taskId, ReassignTaskRequest request)
    {
        try
        {
            await _mediator.Send(new ReassignTaskCommand(taskId, request.AssigneeId));
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

    [HttpDelete("{taskId}")]
    public async Task<IActionResult> Delete(Guid taskId)
    {
        try
        {
            await _mediator.Send(
                new DeleteTaskCommand(taskId));

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
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }


    [HttpPut("{taskId}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid taskId,
        UpdateStatusRequest request)
    {
        try
        {
            await _mediator.Send(
                new UpdateTaskStatusCommand(
                    taskId,
                    request.Status));

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


    [HttpPut("{taskId}/sprint")]
    public async Task<IActionResult> MoveToSprint(
        Guid taskId,
        MoveToSprintRequest request)
    {
        try
        {
            await _mediator.Send(
                new MoveToSprintCommand(
                    taskId,
                    request.SprintId));

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
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = ex.Message });
        }
    }
}


public record CreateTaskRequest(
    Guid ProjectId, Guid? SprintId, Guid? ParentTaskId, string Title, string? Description,
    IssueType IssueType, Priority Priority, int? StoryPoint,
    Guid? AssigneeId, DateTime? DueDate);


public record CreateSubtaskRequest(
    string Title,
    Guid? AssigneeId);


public record UpdateTaskRequest(string Title, string? Description, Priority Priority, int? StoryPoint, DateTime? DueDate);
public record ReassignTaskRequest(Guid? AssigneeId);


public record UpdateStatusRequest(
    ItemStatus Status);


public record MoveToSprintRequest(
    Guid? SprintId);