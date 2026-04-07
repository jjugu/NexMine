namespace Nexmine.Application.Features.Reports.Dtos;

public class TimeReportGroupDto
{
    public string GroupKey { get; set; } = "";
    public int GroupId { get; set; }
    public decimal TotalHours { get; set; }
    public List<TimeReportEntryDto> Entries { get; set; } = [];
}
