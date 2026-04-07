using FluentValidation;
using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Validators;

public class UpdateRoleRequestValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(50).WithMessage("Role name must not exceed 50 characters.")
            .When(x => x.Name is not null);
    }
}
