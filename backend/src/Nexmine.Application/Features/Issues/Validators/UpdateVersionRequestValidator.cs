using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class UpdateVersionRequestValidator : AbstractValidator<UpdateVersionRequest>
{
    public UpdateVersionRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(100).WithMessage("Version name must not exceed 100 characters.")
            .When(x => x.Name is not null);

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid version status.")
            .When(x => x.Status.HasValue);
    }
}
