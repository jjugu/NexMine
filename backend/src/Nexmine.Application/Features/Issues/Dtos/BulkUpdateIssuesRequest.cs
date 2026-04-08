namespace Nexmine.Application.Features.Issues.Dtos;

public class BulkUpdateIssuesRequest
{
    public List<int> IssueIds { get; set; } = [];
    public int? StatusId { get; set; }
    public int? PriorityId { get; set; }
    public int? AssignedToId { get; set; }
    public int? TrackerId { get; set; }
    public int? VersionId { get; set; }
    public int? CategoryId { get; set; }
}
