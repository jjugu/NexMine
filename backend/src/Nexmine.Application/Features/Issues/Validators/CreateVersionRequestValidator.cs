using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class CreateVersionRequestValidator : AbstractValidator<CreateVersionRequest>
{
    public CreateVersionRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Version name is required.")
            .MaximumLength(100).WithMessage("Version name must not exceed 100 characters.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid version status.");
    }
}
