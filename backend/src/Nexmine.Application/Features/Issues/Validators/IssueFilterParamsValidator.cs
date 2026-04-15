using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class IssueFilterParamsValidator : AbstractValidator<IssueFilterParams>
{
    public IssueFilterParamsValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("페이지는 1 이상이어야 합니다.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("페이지 크기는 1~100 사이여야 합니다.");

        RuleFor(x => x.SortDir)
            .Must(value => string.IsNullOrWhiteSpace(value) || value.Equals("asc", StringComparison.OrdinalIgnoreCase) || value.Equals("desc", StringComparison.OrdinalIgnoreCase))
            .WithMessage("정렬 방향은 asc 또는 desc여야 합니다.");

        RuleFor(x => x)
            .Must(x => !x.StartDateFrom.HasValue || !x.StartDateTo.HasValue || x.StartDateFrom <= x.StartDateTo)
            .WithMessage("시작일 범위가 올바르지 않습니다.");

        RuleFor(x => x)
            .Must(x => !x.DueDateFrom.HasValue || !x.DueDateTo.HasValue || x.DueDateFrom <= x.DueDateTo)
            .WithMessage("기한 범위가 올바르지 않습니다.");
    }
}
