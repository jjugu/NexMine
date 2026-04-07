using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class CreateIssueRequestValidator : AbstractValidator<CreateIssueRequest>
{
    public CreateIssueRequestValidator()
    {
        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subject is required.")
            .MaximumLength(255).WithMessage("Subject must not exceed 255 characters.");

        RuleFor(x => x.TrackerId)
            .GreaterThan(0).WithMessage("Valid tracker ID is required.");

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
