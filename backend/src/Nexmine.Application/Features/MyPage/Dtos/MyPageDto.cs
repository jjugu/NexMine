namespace Nexmine.Application.Features.MyPage.Dtos;

public class MyPageDto
{
    public List<WidgetConfigDto> Widgets { get; set; } = [];
    public MyPageDataDto Data { get; set; } = new();
}

public class WidgetConfigDto
{
    public int Id { get; set; }
    public string WidgetType { get; set; } = "";
    public int Position { get; set; }
    public int Column { get; set; }
}

public class MyPageDataDto
{
    public MyIssuesWidgetDto? MyIssues { get; set; }
    public WatchedIssuesWidgetDto? WatchedIssues { get; set; }
    public RecentActivityWidgetDto? RecentActivity { get; set; }
    public OverdueIssuesWidgetDto? OverdueIssues { get; set; }
    public TimeEntriesWidgetDto? TimeEntries { get; set; }
    public CalendarWidgetDto? Calendar { get; set; }
}
