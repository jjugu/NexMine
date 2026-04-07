namespace Nexmine.Application.Features.Workflows.Dtos;

public class UpdateWorkflowRequest
{
    public int RoleId { get; set; }
    public int TrackerId { get; set; }
    public List<WorkflowTransitionItem> Transitions { get; set; } = [];
}

public class WorkflowTransitionItem
{
    public int OldStatusId { get; set; }
    public int NewStatusId { get; set; }
}
