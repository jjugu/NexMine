namespace Nexmine.Application.Features.Reports.Dtos;

public class TimeReportFilterParams
{
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public int? ProjectId { get; set; }
    public int? UserId { get; set; }
    public string GroupBy { get; set; } = "user";
}
