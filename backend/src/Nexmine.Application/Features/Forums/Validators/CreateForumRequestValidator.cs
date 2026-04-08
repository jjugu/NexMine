using FluentValidation;
using Nexmine.Application.Features.Forums.Dtos;

namespace Nexmine.Application.Features.Forums.Validators;

public class CreateForumRequestValidator : AbstractValidator<CreateForumRequest>
{
    public CreateForumRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("포럼 이름은 필수입니다.")
            .MaximumLength(100).WithMessage("포럼 이름은 100자를 초과할 수 없습니다.");
    }
}
