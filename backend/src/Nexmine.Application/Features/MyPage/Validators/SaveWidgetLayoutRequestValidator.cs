using FluentValidation;
using Nexmine.Application.Features.MyPage.Dtos;

namespace Nexmine.Application.Features.MyPage.Validators;

public class SaveWidgetLayoutRequestValidator : AbstractValidator<SaveWidgetLayoutRequest>
{
    private static readonly HashSet<string> ValidWidgetTypes =
    [
        "my_issues",
        "watched_issues",
        "recent_activity",
        "calendar",
        "overdue_issues",
        "time_entries"
    ];

    public SaveWidgetLayoutRequestValidator()
    {
        RuleFor(x => x.Widgets)
            .NotEmpty().WithMessage("위젯 목록은 비어있을 수 없습니다.");

        RuleForEach(x => x.Widgets).ChildRules(widget =>
        {
            widget.RuleFor(w => w.WidgetType)
                .NotEmpty().WithMessage("위젯 타입은 필수입니다.")
                .Must(t => ValidWidgetTypes.Contains(t))
                .WithMessage("유효하지 않은 위젯 타입입니다.");

            widget.RuleFor(w => w.Column)
                .InclusiveBetween(0, 1)
                .WithMessage("컬럼은 0 또는 1이어야 합니다.");

            widget.RuleFor(w => w.Position)
                .GreaterThanOrEqualTo(0)
                .WithMessage("위치는 0 이상이어야 합니다.");
        });
    }
}
