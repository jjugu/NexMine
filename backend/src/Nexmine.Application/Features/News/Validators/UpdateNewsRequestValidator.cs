using FluentValidation;
using Nexmine.Application.Features.News.Dtos;

namespace Nexmine.Application.Features.News.Validators;

public class UpdateNewsRequestValidator : AbstractValidator<UpdateNewsRequest>
{
    public UpdateNewsRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("제목은 200자를 초과할 수 없습니다.")
            .When(x => x.Title is not null);

        RuleFor(x => x.Summary)
            .MaximumLength(500).WithMessage("요약은 500자를 초과할 수 없습니다.")
            .When(x => x.Summary is not null);
    }
}
