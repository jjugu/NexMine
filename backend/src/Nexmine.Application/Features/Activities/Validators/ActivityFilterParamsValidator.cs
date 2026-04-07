using FluentValidation;
using Nexmine.Application.Features.Activities.Dtos;

namespace Nexmine.Application.Features.Activities.Validators;

public class ActivityFilterParamsValidator : AbstractValidator<ActivityFilterParams>
{
    public ActivityFilterParamsValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100.");
    }
}
