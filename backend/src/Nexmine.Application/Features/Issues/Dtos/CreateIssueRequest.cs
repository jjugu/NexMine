using Nexmine.Application.Features.CustomFields.Dtos;

namespace Nexmine.Application.Features.Issues.Dtos;

public class CreateIssueRequest
{
    public int TrackerId { get; set; }
    public int? StatusId { get; set; }
    public int? PriorityId { get; set; }
    public int? CategoryId { get; set; }
    public int? VersionId { get; set; }
    public int? AssignedToId { get; set; }
    public int? ParentIssueId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public int? DoneRatio { get; set; }
    public bool IsPrivate { get; set; }
    public List<CustomValueItem>? CustomValues { get; set; }
}
