using FluentValidation;
using Nexmine.Application.Features.Wiki.Dtos;

namespace Nexmine.Application.Features.Wiki.Validators;

public class CreateWikiPageRequestValidator : AbstractValidator<CreateWikiPageRequest>
{
    public CreateWikiPageRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Wiki page title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");
    }
}
