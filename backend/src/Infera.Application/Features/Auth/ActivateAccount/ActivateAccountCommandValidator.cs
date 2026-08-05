using FluentValidation;

namespace Infera.Application.Features.Auth.ActivateAccount;

public class ActivateAccountCommandValidator : AbstractValidator<ActivateAccountCommand>
{
    public ActivateAccountCommandValidator()
    {
        RuleFor(x => x.ActivationToken).NotEmpty();
        RuleFor(x => x.NewPassword)
            .MinimumLength(8).WithMessage("Parola en az 8 karakter olmalıdır.")
            .Matches("[A-Z]").WithMessage("Parola en az bir büyük harf içermelidir.")
            .Matches("[0-9]").WithMessage("Parola en az bir rakam içermelidir.");
    }
}