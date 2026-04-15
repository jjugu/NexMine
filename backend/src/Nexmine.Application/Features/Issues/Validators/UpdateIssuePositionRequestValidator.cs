using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class UpdateIssuePositionRequestValidator : AbstractValidator<UpdateIssuePositionRequest>
{
    public UpdateIssuePositionRequestValidator()
    {
        RuleFor(x => x.Position)
            .GreaterThanOrEqualTo(0).WithMessage("위치는 0 이상이어야 합니다.");
    }
}
