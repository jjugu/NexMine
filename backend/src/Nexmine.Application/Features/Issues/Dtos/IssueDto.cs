namespace Nexmine.Application.Features.Issues.Dtos;

public class IssueDto
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string TrackerName { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string PriorityName { get; set; } = string.Empty;
    public string? AssignedToName { get; set; }
    public string? AuthorName { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public int DoneRatio { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
