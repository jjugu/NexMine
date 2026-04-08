namespace Nexmine.Application.Features.MyPage.Dtos;

public class RecentActivityWidgetDto
{
    public List<ActivityItem> Items { get; set; } = [];
}

public class ActivityItem
{
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string ProjectName { get; set; } = "";
    public string ProjectIdentifier { get; set; } = "";
    public string UserName { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public int? IssueId { get; set; }
}
