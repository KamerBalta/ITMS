using FluentValidation;

namespace Infera.Application.Features.Users.CreateUser;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Ad alanı zorunludur.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("E-posta alanı zorunludur.")
            .EmailAddress()
            .WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Title)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Title));

        RuleFor(x => x.TeamRole)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.TeamRole));
    }
}