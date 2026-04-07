using FluentValidation;
using Nexmine.Application.Features.CustomFields.Dtos;

namespace Nexmine.Application.Features.CustomFields.Validators;

public class CreateCustomFieldRequestValidator : AbstractValidator<CreateCustomFieldRequest>
{
    public CreateCustomFieldRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("커스텀 필드 이름은 필수입니다.")
            .MaximumLength(100).WithMessage("커스텀 필드 이름은 100자를 초과할 수 없습니다.");

        RuleFor(x => x.FieldFormat)
            .IsInEnum().WithMessage("유효하지 않은 필드 형식입니다.");

        RuleFor(x => x.Customizable)
            .NotEmpty().WithMessage("Customizable 타입은 필수입니다.")
            .MaximumLength(20).WithMessage("Customizable 타입은 20자를 초과할 수 없습니다.");
    }
}
