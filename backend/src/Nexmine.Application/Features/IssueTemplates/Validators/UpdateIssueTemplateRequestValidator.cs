using FluentValidation;
using Nexmine.Application.Features.IssueTemplates.Dtos;

namespace Nexmine.Application.Features.IssueTemplates.Validators;

public class UpdateIssueTemplateRequestValidator : AbstractValidator<UpdateIssueTemplateRequest>
{
    public UpdateIssueTemplateRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("템플릿 이름은 200자를 초과할 수 없습니다.")
            .When(x => x.Title is not null);
    }
}
