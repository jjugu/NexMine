namespace Nexmine.Application.Features.Issues.Dtos;

public class IssueFilterParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public int[]? TrackerId { get; set; }
    public int[]? StatusId { get; set; }
    public int[]? PriorityId { get; set; }
    public int? CategoryId { get; set; }
    public int? VersionId { get; set; }
    public int? AssignedToId { get; set; }
    public int? AuthorId { get; set; }
    public int? ParentIssueId { get; set; }
    public DateOnly? StartDateFrom { get; set; }
    public DateOnly? StartDateTo { get; set; }
    public DateOnly? DueDateFrom { get; set; }
    public DateOnly? DueDateTo { get; set; }
    public bool? IsPrivate { get; set; }
    public bool? IsClosed { get; set; }
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
    public bool? SortDesc { get; set; }

    public bool IsSortDescending => SortDesc ?? !string.Equals(SortDir, "asc", StringComparison.OrdinalIgnoreCase);
}
