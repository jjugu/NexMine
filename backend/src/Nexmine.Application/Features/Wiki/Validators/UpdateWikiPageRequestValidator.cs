using FluentValidation;
using Nexmine.Application.Features.Wiki.Dtos;

namespace Nexmine.Application.Features.Wiki.Validators;

public class UpdateWikiPageRequestValidator : AbstractValidator<UpdateWikiPageRequest>
{
    public UpdateWikiPageRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.")
            .When(x => x.Title is not null);

        RuleFor(x => x.Comments)
            .MaximumLength(500).WithMessage("Comments must not exceed 500 characters.")
            .When(x => x.Comments is not null);
    }
}
