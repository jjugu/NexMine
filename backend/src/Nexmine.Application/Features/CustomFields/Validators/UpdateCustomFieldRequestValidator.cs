using FluentValidation;
using Nexmine.Application.Features.CustomFields.Dtos;

namespace Nexmine.Application.Features.CustomFields.Validators;

public class UpdateCustomFieldRequestValidator : AbstractValidator<UpdateCustomFieldRequest>
{
    public UpdateCustomFieldRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(100).WithMessage("커스텀 필드 이름은 100자를 초과할 수 없습니다.")
            .When(x => x.Name is not null);

        RuleFor(x => x.FieldFormat)
            .IsInEnum().WithMessage("유효하지 않은 필드 형식입니다.")
            .When(x => x.FieldFormat.HasValue);
    }
}
