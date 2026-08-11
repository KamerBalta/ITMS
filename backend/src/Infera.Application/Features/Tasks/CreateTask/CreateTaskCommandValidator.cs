using FluentValidation;

namespace Infera.Application.Features.Tasks.CreateTask;

public class CreateTaskCommandValidator : AbstractValidator<CreateTaskCommand>
{
    private static readonly int[] ValidStoryPoints = { 1, 2, 3, 5, 8, 13, 21 };

    public CreateTaskCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Görev başlığı (Title) zorunludur.")
            .MaximumLength(255);

        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("Proje (Project) seçimi zorunludur.");

        // BR-003: Story Point yalnizca Fibonacci degerlerinden biri olabilir (bos birakilabilir)
        RuleFor(x => x.StoryPoint)
            .Must(sp => sp is null || ValidStoryPoints.Contains(sp.Value))
            .WithMessage("Story Point yalnızca 1, 2, 3, 5, 8, 13 veya 21 değerlerinden biri olabilir.");

        // BR-008: Due Date, gorev olusturma tarihinden once olamaz
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        RuleFor(x => x.DueDate)
            .Must(due => due is null || due.Value >= today)
            .WithMessage("Teslim tarihi (Due Date) geçmiş bir tarih olamaz.");
    }
}