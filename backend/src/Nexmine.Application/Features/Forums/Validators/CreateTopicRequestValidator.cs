using FluentValidation;
using Nexmine.Application.Features.Forums.Dtos;

namespace Nexmine.Application.Features.Forums.Validators;

public class CreateTopicRequestValidator : AbstractValidator<CreateTopicRequest>
{
    public CreateTopicRequestValidator()
    {
        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("주제는 필수입니다.")
            .MaximumLength(255).WithMessage("주제는 255자를 초과할 수 없습니다.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("내용은 필수입니다.");
    }
}
