using FluentValidation;

namespace Infera.Application.Features.CustomFields;

public class CreateCustomFieldCommandValidator : AbstractValidator<CreateCustomFieldCommand>
{
    public CreateCustomFieldCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
        RuleFor(x => x.FieldType).Must(t => t is "text" or "number" or "select" or "user")
            .WithMessage("Geçersiz alan tipi.");
        RuleFor(x => x.OptionsJson)
            .NotEmpty()
            .When(x => x.FieldType == "select")
            .WithMessage("Seçim Listesi tipi için en az bir seçenek girmelisiniz.");
    }
}