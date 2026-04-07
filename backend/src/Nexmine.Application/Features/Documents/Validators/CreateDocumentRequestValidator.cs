using FluentValidation;
using Nexmine.Application.Features.Documents.Dtos;

namespace Nexmine.Application.Features.Documents.Validators;

public class CreateDocumentRequestValidator : AbstractValidator<CreateDocumentRequest>
{
    public CreateDocumentRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Document title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.CategoryName)
            .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.")
            .When(x => x.CategoryName is not null);
    }
}
