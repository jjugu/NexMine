using FluentValidation;
using Nexmine.Application.Features.SavedQueries.Dtos;

namespace Nexmine.Application.Features.SavedQueries.Validators;

public class CreateSavedQueryRequestValidator : AbstractValidator<CreateSavedQueryRequest>
{
    public CreateSavedQueryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("필터 이름은 필수입니다.")
            .MaximumLength(100).WithMessage("필터 이름은 100자를 초과할 수 없습니다.");
    }
}
