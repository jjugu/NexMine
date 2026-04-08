namespace Nexmine.Application.Features.Roadmap.Dtos;

public class RoadmapIssueDto
{
    public int Id { get; set; }
    public string Subject { get; set; } = "";
    public string TrackerName { get; set; } = "";
    public string StatusName { get; set; } = "";
    public bool IsClosed { get; set; }
    public string PriorityName { get; set; } = "";
    public string? AssigneeName { get; set; }
    public int DoneRatio { get; set; }
}
