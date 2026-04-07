namespace Nexmine.Domain.Entities;

public class WorkflowTransition
{
    public int RoleId { get; set; }
    public int TrackerId { get; set; }
    public int OldStatusId { get; set; }
    public int NewStatusId { get; set; }

    public Role Role { get; set; } = null!;
    public Tracker Tracker { get; set; } = null!;
    public IssueStatus OldStatus { get; set; } = null!;
    public IssueStatus NewStatus { get; set; } = null!;
}
