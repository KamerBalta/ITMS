using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;

namespace Infera.Application.Features.Workflow;

public static class DefaultWorkflowSeeder
{
    public static async System.Threading.Tasks.Task<Board> AssignDefaultsAsync(IAppDbContext db, Guid projectId, string projectName, CancellationToken ct)
    {
        // 1. Durumlar (Statuses)
        var toDo = new ProjectWorkflowStatus { ProjectId = projectId, Name = "To Do", Category = "ToDo", DisplayOrder = 0, IsInitial = true };
        var inProgress = new ProjectWorkflowStatus { ProjectId = projectId, Name = "In Progress", Category = "InProgress", DisplayOrder = 1 };
        var readyForReview = new ProjectWorkflowStatus { ProjectId = projectId, Name = "Ready for Review", Category = "InProgress", DisplayOrder = 2 };
        var readyForQA = new ProjectWorkflowStatus { ProjectId = projectId, Name = "Ready for QA", Category = "InProgress", DisplayOrder = 3 };
        var done = new ProjectWorkflowStatus { ProjectId = projectId, Name = "Done", Category = "Done", DisplayOrder = 4, IsEpicCloseTarget = true };
        var closed = new ProjectWorkflowStatus { ProjectId = projectId, Name = "Closed", Category = "Done", DisplayOrder = 5 };

        db.ProjectWorkflowStatuses.AddRange(toDo, inProgress, readyForReview, readyForQA, done, closed);

        // 2. Varsayılan Scrum Board
        var scrumBoard = new Board
        {
            ProjectId = projectId,
            Name = $"{projectName} Board",
            BoardType = "Scrum"
        };
        db.Boards.Add(scrumBoard);

        // 3. Kolonlar - Doğrudan Board referansı verilerek EF Core dependency grafiği kurulur
        var colToDo = new BoardColumn { Board = scrumBoard, Name = "To Do", DisplayOrder = 0 };
        var colInProgress = new BoardColumn { Board = scrumBoard, Name = "In Progress", DisplayOrder = 1 };
        var colReview = new BoardColumn { Board = scrumBoard, Name = "Ready for Review", DisplayOrder = 2 };
        var colQA = new BoardColumn { Board = scrumBoard, Name = "Ready for QA", DisplayOrder = 3 };
        var colDone = new BoardColumn { Board = scrumBoard, Name = "Done", DisplayOrder = 4 };

        db.BoardColumns.AddRange(colToDo, colInProgress, colReview, colQA, colDone);

        // Status, Board ve Column Id'lerinin EF Core tarafından üretilmesi için kaydediyoruz
        await db.SaveChangesAsync(ct);

        // 4. Durum - Kolon Eşleşmeleri (Status to Column Mappings)
        db.BoardStatusColumnMappings.AddRange(
            new BoardStatusColumnMapping { BoardId = scrumBoard.Id, StatusId = toDo.Id, ColumnId = colToDo.Id },
            new BoardStatusColumnMapping { BoardId = scrumBoard.Id, StatusId = inProgress.Id, ColumnId = colInProgress.Id },
            new BoardStatusColumnMapping { BoardId = scrumBoard.Id, StatusId = readyForReview.Id, ColumnId = colReview.Id },
            new BoardStatusColumnMapping { BoardId = scrumBoard.Id, StatusId = readyForQA.Id, ColumnId = colQA.Id },
            new BoardStatusColumnMapping { BoardId = scrumBoard.Id, StatusId = done.Id, ColumnId = colDone.Id },
            new BoardStatusColumnMapping { BoardId = scrumBoard.Id, StatusId = closed.Id, ColumnId = colDone.Id });

        // 5. İş Akışı Geçişleri (Workflow Transitions)
        const string pmAndAdmin = "Project Manager,System Admin";
        const string qaPmAdmin = "QA/Tester,Project Manager,System Admin";

        db.WorkflowTransitions.AddRange(
            new WorkflowTransition { ProjectId = projectId, FromStatusId = toDo.Id, ToStatusId = inProgress.Id, AllowedRoles = "Developer," + pmAndAdmin, RequireAssigneeSelf = true },
            new WorkflowTransition { ProjectId = projectId, FromStatusId = inProgress.Id, ToStatusId = readyForReview.Id, AllowedRoles = "Developer," + pmAndAdmin, RequireAssigneeSelf = true },
            new WorkflowTransition { ProjectId = projectId, FromStatusId = readyForReview.Id, ToStatusId = readyForQA.Id, AllowedRoles = pmAndAdmin, RequireAssigneeSelf = false },
            new WorkflowTransition { ProjectId = projectId, FromStatusId = readyForQA.Id, ToStatusId = done.Id, AllowedRoles = qaPmAdmin, RequireAssigneeSelf = false },
            new WorkflowTransition { ProjectId = projectId, FromStatusId = readyForQA.Id, ToStatusId = inProgress.Id, AllowedRoles = qaPmAdmin, RequireAssigneeSelf = false });

        await db.SaveChangesAsync(ct);
        return scrumBoard;
    }
}