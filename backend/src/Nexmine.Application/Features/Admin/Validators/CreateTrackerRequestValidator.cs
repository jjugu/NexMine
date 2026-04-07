using FluentValidation;
using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Validators;

public class CreateTrackerRequestValidator : AbstractValidator<CreateTrackerRequest>
{
    public CreateTrackerRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tracker name is required.")
            .MaximumLength(50).WithMessage("Tracker name must not exceed 50 characters.");
    }
}
