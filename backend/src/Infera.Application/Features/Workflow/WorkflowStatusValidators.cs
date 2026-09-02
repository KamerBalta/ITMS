using FluentValidation;

namespace Infera.Application.Features.Workflow;

public class CreateWorkflowStatusCommandValidator : AbstractValidator<CreateWorkflowStatusCommand>
{
    public CreateWorkflowStatusCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Category).NotEmpty().Must(c => c is "ToDo" or "InProgress" or "Done")
            .WithMessage("Kategori 'ToDo', 'InProgress' veya 'Done' olmalıdır.");
        RuleFor(x => x.Color).MaximumLength(20);
    }
}

public class UpdateWorkflowStatusCommandValidator : AbstractValidator<UpdateWorkflowStatusCommand>
{
    public UpdateWorkflowStatusCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Category).NotEmpty().Must(c => c is "ToDo" or "InProgress" or "Done");
    }
}