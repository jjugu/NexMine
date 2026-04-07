using FluentValidation;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Validators;

public class CreateJournalRequestValidator : AbstractValidator<CreateJournalRequest>
{
    public CreateJournalRequestValidator()
    {
        RuleFor(x => x.Notes)
            .NotEmpty().WithMessage("Journal notes are required.");
    }
}
