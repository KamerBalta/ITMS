using FluentValidation;

namespace Infera.Application.Features.BoardColumns;

public class CreateBoardColumnCommandValidator : AbstractValidator<CreateBoardColumnCommand>
{
    public CreateBoardColumnCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
    }
}

public class UpdateBoardColumnCommandValidator : AbstractValidator<UpdateBoardColumnCommand>
{
    public UpdateBoardColumnCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
    }
}