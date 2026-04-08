namespace Nexmine.Application.Features.Roadmap.Dtos;

public class RoadmapVersionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int Status { get; set; }
    public string? DueDate { get; set; }
    public int TotalIssues { get; set; }
    public int ClosedIssues { get; set; }
    public int OpenIssues { get; set; }
    public decimal CompletionPercentage { get; set; }
    public List<RoadmapIssueDto> Issues { get; set; } = [];
}
