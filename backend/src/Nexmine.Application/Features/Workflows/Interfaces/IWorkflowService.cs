using Nexmine.Application.Features.Workflows.Dtos;

namespace Nexmine.Application.Features.Workflows.Interfaces;

public interface IWorkflowService
{
    Task<List<WorkflowTransitionDto>> GetTransitionsAsync(int roleId, int trackerId);
    Task UpdateTransitionsAsync(UpdateWorkflowRequest request);
    Task<List<AllowedStatusDto>> GetAllowedStatusesAsync(int issueId, int userId);
    Task<bool> CanTransitionAsync(int roleId, int trackerId, int oldStatusId, int newStatusId);
}
