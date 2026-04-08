using FluentValidation;
using Nexmine.Application.Features.Forums.Dtos;

namespace Nexmine.Application.Features.Forums.Validators;

public class CreateReplyRequestValidator : AbstractValidator<CreateReplyRequest>
{
    public CreateReplyRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("답글 내용은 필수입니다.");
    }
}
