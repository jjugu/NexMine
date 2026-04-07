namespace Nexmine.Application.Features.Issues.Dtos;

public class GanttIssueDto
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? TrackerName { get; set; }
    public string? PriorityName { get; set; }
    public string? AssignedToName { get; set; }
    public string? StatusName { get; set; }
    public int? ParentIssueId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public int DoneRatio { get; set; }
    public List<GanttRelationDto> Relations { get; set; } = [];
}

public class GanttRelationDto
{
    public int IssueFromId { get; set; }
    public int IssueToId { get; set; }
    public int RelationType { get; set; }
    public int? Delay { get; set; }
}
