using FluentValidation;

namespace Infera.Application.Features.Users.CreateUser;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Ad alanı zorunludur.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta alanı zorunludur.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Password)
            .MinimumLength(8).WithMessage("Parola en az 8 karakter olmalıdır.")
            .Matches("[A-Z]").WithMessage("Parola en az bir büyük harf içermelidir.")
            .Matches("[0-9]").WithMessage("Parola en az bir rakam içermelidir.");
    }
}