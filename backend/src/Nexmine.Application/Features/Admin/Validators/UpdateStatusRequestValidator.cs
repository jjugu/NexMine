using FluentValidation;
using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Validators;

public class UpdateStatusRequestValidator : AbstractValidator<UpdateStatusRequest>
{
    public UpdateStatusRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(50).WithMessage("Status name must not exceed 50 characters.")
            .When(x => x.Name is not null);
    }
}
