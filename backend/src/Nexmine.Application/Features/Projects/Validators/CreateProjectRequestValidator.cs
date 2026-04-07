using FluentValidation;
using Nexmine.Application.Features.Projects.Dtos;

namespace Nexmine.Application.Features.Projects.Validators;

public class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required.")
            .MaximumLength(200).WithMessage("Project name must not exceed 200 characters.");

        RuleFor(x => x.Identifier)
            .NotEmpty().WithMessage("Project identifier is required.")
            .MaximumLength(100).WithMessage("Project identifier must not exceed 100 characters.")
            .Matches(@"^[a-z0-9\-]+$").WithMessage("Identifier must contain only lowercase letters, numbers, and hyphens.");
    }
}
