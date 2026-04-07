using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class UpdateIssueCategoryRequestValidator : AbstractValidator<UpdateIssueCategoryRequest>
{
    public UpdateIssueCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.")
            .When(x => x.Name is not null);
    }
}
