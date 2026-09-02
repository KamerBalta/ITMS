using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;

namespace Infera.Application.Features.Workflow;

public static class DefaultWorkflowSeeder
{
    public static async System.Threading.Tasks.Task AssignDefaultsAsync(IAppDbContext db, Guid projectId, CancellationToken ct)
    {
        var toDo = new ProjectWorkflowStatus { ProjectId = projectId, Name = "To Do", Category = "ToDo", DisplayOrder = 0, IsInitial = true };
        var inProgress = new ProjectWorkflowStatus { ProjectId = projectId, Name = "In Progress", Category = "InProgress", DisplayOrder = 1 };
        var readyForReview = new ProjectWorkflowStatus { ProjectId = projectId, Name = "Ready for Review", Category = "InProgress", DisplayOrder = 2 };
        var readyForQA = new ProjectWorkflowStatus { ProjectId = projectId, Name = "Ready for QA", Category = "InProgress", DisplayOrder = 3 };
        var done = new ProjectWorkflowStatus { ProjectId = projectId, Name = "Done", Category = "Done", DisplayOrder = 4, IsEpicCloseTarget = true };
        var closed = new ProjectWorkflowStatus { ProjectId = projectId, Name = "Closed", Category = "Done", DisplayOrder = 5 };

        db.ProjectWorkflowStatuses.AddRange(toDo, inProgress, readyForReview, readyForQA, done, closed);

        // #4: Column'lar Status'lardan BAGIMSIZ ayri bir kavram -- varsayilan olarak mevcut
        // gorunumu koruyacak sekilde 5 kolon olusturup 1:1 (Closed haric, o "Done" kolonuna paylasir) esliyoruz.
        var colToDo = new BoardColumn { ProjectId = projectId, Name = "To Do", DisplayOrder = 0 };
        var colInProgress = new BoardColumn { ProjectId = projectId, Name = "In Progress", DisplayOrder = 1 };
        var colReview = new BoardColumn { ProjectId = projectId, Name = "Ready for Review", DisplayOrder = 2 };
        var colQA = new BoardColumn { ProjectId = projectId, Name = "Ready for QA", DisplayOrder = 3 };
        var colDone = new BoardColumn { ProjectId = projectId, Name = "Done", DisplayOrder = 4 };

        db.BoardColumns.AddRange(colToDo, colInProgress, colReview, colQA, colDone);
        await db.SaveChangesAsync(ct); // Id'lerin uretilmesi icin once kaydet

        toDo.BoardColumnId = colToDo.Id;
        inProgress.BoardColumnId = colInProgress.Id;
        readyForReview.BoardColumnId = colReview.Id;
        readyForQA.BoardColumnId = colQA.Id;
        done.BoardColumnId = colDone.Id;
        closed.BoardColumnId = colDone.Id; // Closed, Done kolonunu paylasir

        const string pmAndAdmin = "Project Manager,System Admin";
        const string qaPmAdmin = "QA/Tester,Project Manager,System Admin";

        db.WorkflowTransitions.AddRange(
            new WorkflowTransition { ProjectId = projectId, FromStatusId = toDo.Id, ToStatusId = inProgress.Id, AllowedRoles = "Developer," + pmAndAdmin, RequireAssigneeSelf = true },
            new WorkflowTransition { ProjectId = projectId, FromStatusId = inProgress.Id, ToStatusId = readyForReview.Id, AllowedRoles = "Developer," + pmAndAdmin, RequireAssigneeSelf = true },
            new WorkflowTransition { ProjectId = projectId, FromStatusId = readyForReview.Id, ToStatusId = readyForQA.Id, AllowedRoles = pmAndAdmin, RequireAssigneeSelf = false },
            new WorkflowTransition { ProjectId = projectId, FromStatusId = readyForQA.Id, ToStatusId = done.Id, AllowedRoles = qaPmAdmin, RequireAssigneeSelf = false },
            new WorkflowTransition { ProjectId = projectId, FromStatusId = readyForQA.Id, ToStatusId = inProgress.Id, AllowedRoles = qaPmAdmin, RequireAssigneeSelf = false });

        await db.SaveChangesAsync(ct);
    }
}