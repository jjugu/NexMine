using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class CreateTimeEntryRequestValidator : AbstractValidator<CreateTimeEntryRequest>
{
    public CreateTimeEntryRequestValidator()
    {
        RuleFor(x => x.Hours)
            .GreaterThan(0).WithMessage("Hours must be greater than 0.")
            .LessThanOrEqualTo(24).WithMessage("Hours must not exceed 24.");

        RuleFor(x => x.SpentOn)
            .NotEmpty().WithMessage("Spent on date is required.");

        RuleFor(x => x.ActivityType)
            .IsInEnum().WithMessage("Invalid activity type.");

        RuleFor(x => x.Comments)
            .MaximumLength(500).WithMessage("Comments must not exceed 500 characters.")
            .When(x => x.Comments is not null);
    }
}
