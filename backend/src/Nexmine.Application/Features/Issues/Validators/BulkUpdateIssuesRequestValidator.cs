using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class BulkUpdateIssuesRequestValidator : AbstractValidator<BulkUpdateIssuesRequest>
{
    public BulkUpdateIssuesRequestValidator()
    {
        RuleFor(x => x.IssueIds)
            .NotEmpty().WithMessage("일감 ID 목록은 비어 있을 수 없습니다.")
            .Must(ids => ids.Count <= 100).WithMessage("한 번에 최대 100개의 일감만 일괄 수정할 수 있습니다.");
    }
}
