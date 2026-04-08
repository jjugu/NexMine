using FluentValidation;
using Nexmine.Application.Features.IssueTemplates.Dtos;

namespace Nexmine.Application.Features.IssueTemplates.Validators;

public class CreateIssueTemplateRequestValidator : AbstractValidator<CreateIssueTemplateRequest>
{
    public CreateIssueTemplateRequestValidator()
    {
        RuleFor(x => x.TrackerId)
            .GreaterThan(0).WithMessage("트래커 ID는 0보다 커야 합니다.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("템플릿 이름은 필수입니다.")
            .MaximumLength(200).WithMessage("템플릿 이름은 200자를 초과할 수 없습니다.");
    }
}
