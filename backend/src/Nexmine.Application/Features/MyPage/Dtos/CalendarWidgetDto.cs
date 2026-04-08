namespace Nexmine.Application.Features.MyPage.Dtos;

public class CalendarWidgetDto
{
    public List<CalendarEventItem> Events { get; set; } = [];
}

public class CalendarEventItem
{
    public int IssueId { get; set; }
    public string Subject { get; set; } = "";
    public string ProjectIdentifier { get; set; } = "";
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
}
