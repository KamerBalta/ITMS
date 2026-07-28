using FluentValidation;

namespace Infera.Application.Features.Tasks.UpdateTask;

public class UpdateTaskCommandValidator : AbstractValidator<UpdateTaskCommand>
{
    private static readonly int[] ValidStoryPoints = { 1, 2, 3, 5, 8, 13, 21 };

    public UpdateTaskCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Görev başlığı (Title) zorunludur.")
            .MaximumLength(255);

        RuleFor(x => x.StoryPoint)
            .Must(sp => sp is null || ValidStoryPoints.Contains(sp.Value))
            .WithMessage("Story Point yalnızca 1, 2, 3, 5, 8, 13 veya 21 değerlerinden biri olabilir.");

        RuleFor(x => x.DueDate)
            .Must(due => due is null || due.Value.Date >= DateTime.UtcNow.Date)
            .WithMessage("Teslim tarihi (Due Date) geçmiş bir tarih olamaz.");
    }
}