using Nexmine.Domain.Enums;

namespace Nexmine.Application.Features.Issues.Dtos;

public class TimeEntryDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int? IssueId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal Hours { get; set; }
    public DateOnly SpentOn { get; set; }
    public ActivityType ActivityType { get; set; }
    public string? Comments { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
