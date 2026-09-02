using FluentValidation;

namespace Infera.Application.Features.Components;

public class CreateComponentCommandValidator : AbstractValidator<CreateComponentCommand>
{
    public CreateComponentCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Description).MaximumLength(300);
    }
}

public class UpdateComponentCommandValidator : AbstractValidator<UpdateComponentCommand>
{
    public UpdateComponentCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Description).MaximumLength(300);
    }
}