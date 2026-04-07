using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class CreateIssueRelationRequestValidator : AbstractValidator<CreateIssueRelationRequest>
{
    public CreateIssueRelationRequestValidator()
    {
        RuleFor(x => x.IssueToId)
            .GreaterThan(0).WithMessage("Valid target issue ID is required.");

        RuleFor(x => x.RelationType)
            .IsInEnum().WithMessage("Invalid relation type.");

        RuleFor(x => x.Delay)
            .GreaterThanOrEqualTo(0).WithMessage("Delay must be non-negative.")
            .When(x => x.Delay.HasValue);
    }
}
