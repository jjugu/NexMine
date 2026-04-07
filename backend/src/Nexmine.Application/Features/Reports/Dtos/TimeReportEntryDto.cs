namespace Nexmine.Application.Features.Reports.Dtos;

public class TimeReportEntryDto
{
    public int Id { get; set; }
    public string ProjectName { get; set; } = "";
    public string? IssueSubject { get; set; }
    public int? IssueId { get; set; }
    public string UserName { get; set; } = "";
    public string ActivityType { get; set; } = "";
    public decimal Hours { get; set; }
    public DateOnly SpentOn { get; set; }
    public string? Comments { get; set; }
}
