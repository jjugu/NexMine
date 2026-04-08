using FluentValidation;
using Nexmine.Application.Features.Groups.Dtos;

namespace Nexmine.Application.Features.Groups.Validators;

public class CreateUserGroupRequestValidator : AbstractValidator<CreateUserGroupRequest>
{
    public CreateUserGroupRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("그룹 이름은 필수입니다.")
            .MaximumLength(100).WithMessage("그룹 이름은 100자를 초과할 수 없습니다.");
    }
}
