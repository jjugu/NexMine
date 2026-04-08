using FluentValidation;
using Nexmine.Application.Features.Projects.Dtos;

namespace Nexmine.Application.Features.Projects.Validators;

public class CopyProjectRequestValidator : AbstractValidator<CopyProjectRequest>
{
    public CopyProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("프로젝트 이름을 입력해주세요.")
            .MaximumLength(200).WithMessage("프로젝트 이름은 200자 이하여야 합니다.");

        RuleFor(x => x.Identifier)
            .NotEmpty().WithMessage("식별자를 입력해주세요.")
            .MaximumLength(100).WithMessage("식별자는 100자 이하여야 합니다.")
            .Matches(@"^[a-z0-9\-]+$").WithMessage("식별자는 소문자, 숫자, 하이픈만 가능합니다.");
    }
}
