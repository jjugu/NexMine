namespace Nexmine.Domain.Entities;

public class Issue : BaseEntity
{
    public int ProjectId { get; set; }
    public int TrackerId { get; set; }
    public int StatusId { get; set; }
    public int PriorityId { get; set; }
    public int? CategoryId { get; set; }
    public int? VersionId { get; set; }
    public int AuthorId { get; set; }
    public int? AssignedToId { get; set; }
    public int? ParentIssueId { get; set; }

    public string Subject { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public int DoneRatio { get; set; }
    public bool IsPrivate { get; set; }
    public int Position { get; set; }

    public Project Project { get; set; } = null!;
    public Tracker Tracker { get; set; } = null!;
    public IssueStatus Status { get; set; } = null!;
    public IssuePriority Priority { get; set; } = null!;
    public IssueCategory? Category { get; set; }
    public Version? Version { get; set; }
    public User Author { get; set; } = null!;
    public User? AssignedTo { get; set; }
    public Issue? ParentIssue { get; set; }
    public List<Issue> Children { get; set; } = [];
    public List<Journal> Journals { get; set; } = [];
    public List<TimeEntry> TimeEntries { get; set; } = [];
}
