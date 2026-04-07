using Nexmine.Domain.Enums;

namespace Nexmine.Application.Features.Issues.Dtos;

public class CreateTimeEntryRequest
{
    public int ProjectId { get; set; }
    public int? IssueId { get; set; }
    public decimal Hours { get; set; }
    public DateOnly SpentOn { get; set; }
    public ActivityType ActivityType { get; set; }
    public string? Comments { get; set; }
}
