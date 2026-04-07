using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class UpdateTimeEntryRequestValidator : AbstractValidator<UpdateTimeEntryRequest>
{
    public UpdateTimeEntryRequestValidator()
    {
        RuleFor(x => x.Hours)
            .GreaterThan(0).WithMessage("Hours must be greater than 0.")
            .LessThanOrEqualTo(24).WithMessage("Hours must not exceed 24.")
            .When(x => x.Hours.HasValue);

        RuleFor(x => x.ActivityType)
            .IsInEnum().WithMessage("Invalid activity type.")
            .When(x => x.ActivityType.HasValue);

        RuleFor(x => x.Comments)
            .MaximumLength(500).WithMessage("Comments must not exceed 500 characters.")
            .When(x => x.Comments is not null);
    }
}
