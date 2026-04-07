namespace Nexmine.Application.Features.Workflows.Dtos;

public class WorkflowTransitionDto
{
    public int RoleId { get; set; }
    public int TrackerId { get; set; }
    public int OldStatusId { get; set; }
    public int NewStatusId { get; set; }
}
