using FluentValidation;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Permissions;

namespace Nexmine.Application.Features.Admin.Validators;

public class CreateRoleRequestValidator : AbstractValidator<CreateRoleRequest>
{
    public CreateRoleRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("역할 이름은 필수입니다.")
            .MaximumLength(50).WithMessage("역할 이름은 50자를 초과할 수 없습니다.");

        RuleForEach(x => x.Permissions)
            .Must(p => PermissionConstants.All.Contains(p))
            .WithMessage("유효하지 않은 권한입니다: {PropertyValue}")
            .When(x => x.Permissions is not null);
    }
}
