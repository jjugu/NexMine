using FluentValidation;
using Nexmine.Application.Features.Projects.Dtos;

namespace Nexmine.Application.Features.Projects.Validators;

public class UpdateProjectRequestValidator : AbstractValidator<UpdateProjectRequest>
{
    public UpdateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("프로젝트 이름은 200자를 초과할 수 없습니다.")
            .When(x => x.Name is not null);

        RuleFor(x => x.Identifier)
            .MinimumLength(2).WithMessage("식별자는 최소 2자 이상이어야 합니다.")
            .MaximumLength(100).WithMessage("식별자는 100자를 초과할 수 없습니다.")
            .Matches(@"^[a-z0-9][a-z0-9\-]*$").WithMessage("식별자는 영문 소문자, 숫자, 하이픈(-)만 사용 가능하며 소문자/숫자로 시작해야 합니다.")
            .When(x => x.Identifier is not null);
    }
}
