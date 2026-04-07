namespace Nexmine.Application.Features.Issues.Dtos;

public class TimeEntryFilterParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? ProjectId { get; set; }
    public int? IssueId { get; set; }
    public int? UserId { get; set; }
}
