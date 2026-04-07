using FluentValidation;
using Nexmine.Application.Features.Reports.Dtos;

namespace Nexmine.Application.Features.Reports.Validators;

public class TimeReportFilterParamsValidator : AbstractValidator<TimeReportFilterParams>
{
    private static readonly string[] AllowedGroupByValues = ["user", "project", "activity"];

    public TimeReportFilterParamsValidator()
    {
        RuleFor(x => x.GroupBy)
            .Must(v => AllowedGroupByValues.Contains(v))
            .WithMessage("GroupBy는 'user', 'project', 'activity' 중 하나여야 합니다.");

        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithMessage("종료일은 시작일 이후여야 합니다.");
    }
}
