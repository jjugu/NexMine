using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class CopyIssueRequestValidator : AbstractValidator<CopyIssueRequest>
{
    public CopyIssueRequestValidator()
    {
        RuleFor(x => x.TargetProjectId)
            .GreaterThanOrEqualTo(0)
            .WithMessage("대상 프로젝트 ID는 0 이상이어야 합니다.");
    }
}
