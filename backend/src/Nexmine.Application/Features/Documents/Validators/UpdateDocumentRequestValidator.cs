using FluentValidation;
using Nexmine.Application.Features.Documents.Dtos;

namespace Nexmine.Application.Features.Documents.Validators;

public class UpdateDocumentRequestValidator : AbstractValidator<UpdateDocumentRequest>
{
    public UpdateDocumentRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.")
            .When(x => x.Title is not null);

        RuleFor(x => x.CategoryName)
            .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.")
            .When(x => x.CategoryName is not null);
    }
}
