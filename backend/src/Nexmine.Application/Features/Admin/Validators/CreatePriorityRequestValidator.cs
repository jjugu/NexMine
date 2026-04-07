using FluentValidation;
using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Validators;

public class CreatePriorityRequestValidator : AbstractValidator<CreatePriorityRequest>
{
    public CreatePriorityRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Priority name is required.")
            .MaximumLength(50).WithMessage("Priority name must not exceed 50 characters.");
    }
}
