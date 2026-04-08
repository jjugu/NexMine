using FluentValidation;
using Nexmine.Application.Features.News.Dtos;

namespace Nexmine.Application.Features.News.Validators;

public class CreateNewsRequestValidator : AbstractValidator<CreateNewsRequest>
{
    public CreateNewsRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("뉴스 제목은 필수입니다.")
            .MaximumLength(200).WithMessage("제목은 200자를 초과할 수 없습니다.");

        RuleFor(x => x.Summary)
            .MaximumLength(500).WithMessage("요약은 500자를 초과할 수 없습니다.")
            .When(x => x.Summary is not null);
    }
}
