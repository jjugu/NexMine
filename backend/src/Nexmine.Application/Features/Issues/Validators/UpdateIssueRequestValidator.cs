using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class UpdateIssueRequestValidator : AbstractValidator<UpdateIssueRequest>
{
    public UpdateIssueRequestValidator()
    {
        RuleFor(x => x.Subject)
            .MaximumLength(255).WithMessage("Subject must not exceed 255 characters.")
            .When(x => x.Subject is not null);

        RuleFor(x => x.DoneRatio)
            .InclusiveBetween(0, 100).WithMessage("Done ratio must be between 0 and 100.")
            .When(x => x.DoneRatio.HasValue);

        RuleFor(x => x.EstimatedHours)
            .GreaterThan(0).WithMessage("Estimated hours must be greater than 0.")
            .When(x => x.EstimatedHours.HasValue);

        RuleFor(x => x.DueDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Due date must be on or after start date.")
            .When(x => x.StartDate.HasValue && x.DueDate.HasValue);
    }
}
