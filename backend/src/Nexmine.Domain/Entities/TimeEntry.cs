using Nexmine.Domain.Enums;

namespace Nexmine.Domain.Entities;

public class TimeEntry : BaseEntity
{
    public int ProjectId { get; set; }
    public int? IssueId { get; set; }
    public int UserId { get; set; }
    public decimal Hours { get; set; }
    public DateOnly SpentOn { get; set; }
    public ActivityType ActivityType { get; set; }
    public string? Comments { get; set; }

    public Project Project { get; set; } = null!;
    public Issue? Issue { get; set; }
    public User User { get; set; } = null!;
}
