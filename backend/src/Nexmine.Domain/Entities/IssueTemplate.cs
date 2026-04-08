namespace Nexmine.Domain.Entities;

public class IssueTemplate : BaseEntity
{
    public int TrackerId { get; set; }
    public int? ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? SubjectTemplate { get; set; }
    public string? DescriptionTemplate { get; set; }
    public bool IsDefault { get; set; }
    public int Position { get; set; }

    public Tracker Tracker { get; set; } = null!;
    public Project? Project { get; set; }
}
