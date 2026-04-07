using Nexmine.Application.Features.CustomFields.Dtos;

namespace Nexmine.Application.Features.Issues.Dtos;

public class IssueDetailDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int TrackerId { get; set; }
    public string TrackerName { get; set; } = string.Empty;
    public int StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int PriorityId { get; set; }
    public string PriorityName { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? VersionId { get; set; }
    public string? VersionName { get; set; }
    public int AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public int? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public int? ParentIssueId { get; set; }
    public string? ParentIssueSubject { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public int DoneRatio { get; set; }
    public bool IsPrivate { get; set; }
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<CustomValueDto> CustomValues { get; set; } = [];
}
