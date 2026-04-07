using FluentValidation;
using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Validators;

public class UpdatePriorityRequestValidator : AbstractValidator<UpdatePriorityRequest>
{
    public UpdatePriorityRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(50).WithMessage("Priority name must not exceed 50 characters.")
            .When(x => x.Name is not null);
    }
}
