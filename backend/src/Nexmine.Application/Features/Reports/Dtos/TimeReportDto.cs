namespace Nexmine.Application.Features.Reports.Dtos;

public class TimeReportDto
{
    public List<TimeReportGroupDto> Groups { get; set; } = [];
    public decimal TotalHours { get; set; }
}
