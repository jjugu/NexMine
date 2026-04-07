using FluentValidation;
using Nexmine.Application.Features.Workflows.Dtos;

namespace Nexmine.Application.Features.Workflows.Validators;

public class UpdateWorkflowRequestValidator : AbstractValidator<UpdateWorkflowRequest>
{
    public UpdateWorkflowRequestValidator()
    {
        RuleFor(x => x.RoleId)
            .GreaterThan(0).WithMessage("역할 ID는 0보다 커야 합니다.");

        RuleFor(x => x.TrackerId)
            .GreaterThan(0).WithMessage("트래커 ID는 0보다 커야 합니다.");
    }
}
