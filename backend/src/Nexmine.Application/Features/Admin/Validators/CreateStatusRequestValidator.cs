using FluentValidation;
using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Validators;

public class CreateStatusRequestValidator : AbstractValidator<CreateStatusRequest>
{
    public CreateStatusRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Status name is required.")
            .MaximumLength(50).WithMessage("Status name must not exceed 50 characters.");
    }
}
