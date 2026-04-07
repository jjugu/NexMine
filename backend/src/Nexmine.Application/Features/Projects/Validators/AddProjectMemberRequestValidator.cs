using FluentValidation;
using Nexmine.Application.Features.Projects.Dtos;

namespace Nexmine.Application.Features.Projects.Validators;

public class AddProjectMemberRequestValidator : AbstractValidator<AddProjectMemberRequest>
{
    public AddProjectMemberRequestValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("Valid user ID is required.");

        RuleFor(x => x.RoleId)
            .GreaterThan(0).WithMessage("Valid role ID is required.");
    }
}
