using FluentValidation;
using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Validators;

public class UpdateTrackerRequestValidator : AbstractValidator<UpdateTrackerRequest>
{
    public UpdateTrackerRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(50).WithMessage("Tracker name must not exceed 50 characters.")
            .When(x => x.Name is not null);
    }
}
