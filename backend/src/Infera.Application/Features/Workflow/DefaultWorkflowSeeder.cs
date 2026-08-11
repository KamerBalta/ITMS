using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;

namespace Infera.Application.Features.Workflow;

public static class DefaultWorkflowSeeder
{
    // Mevcut BR-004/016/017 kurallarinin birebir veri karsiligi -- proje olusturulunca
    // otomatik atanir, boylece davranis hic degismeden veri odakli hale geliyor.
    public static void AssignDefaults(IAppDbContext db, Guid projectId)
    {
        const string pmAndAdmin = "Project Manager,System Admin";
        const string qaPmAdmin = "QA/Tester,Project Manager,System Admin";

        var transitions = new[]
        {
            // Developer: ToDo -> InProgress -> ReadyForReview (BR-004)
            new WorkflowTransition { ProjectId = projectId, FromStatus = "ToDo", ToStatus = "InProgress", AllowedRoles = "Developer," + pmAndAdmin, RequireAssigneeSelf = true },
            new WorkflowTransition { ProjectId = projectId, FromStatus = "InProgress", ToStatus = "ReadyForReview", AllowedRoles = "Developer," + pmAndAdmin, RequireAssigneeSelf = true },

            // BR-016: ReadyForReview -> ReadyForQA yalnizca PM/Admin
            new WorkflowTransition { ProjectId = projectId, FromStatus = "ReadyForReview", ToStatus = "ReadyForQA", AllowedRoles = pmAndAdmin, RequireAssigneeSelf = false },

            // BR-004: ReadyForQA -> Done yalnizca QA/PM/Admin
            new WorkflowTransition { ProjectId = projectId, FromStatus = "ReadyForQA", ToStatus = "Done", AllowedRoles = qaPmAdmin, RequireAssigneeSelf = false },

            // BR-017: QA red -> geri InProgress'e, yalnizca QA/PM/Admin
            new WorkflowTransition { ProjectId = projectId, FromStatus = "ReadyForQA", ToStatus = "InProgress", AllowedRoles = qaPmAdmin, RequireAssigneeSelf = false },
        };

        db.WorkflowTransitions.AddRange(transitions);
    }
}