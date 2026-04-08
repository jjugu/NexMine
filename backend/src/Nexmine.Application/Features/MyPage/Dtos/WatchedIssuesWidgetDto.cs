namespace Nexmine.Application.Features.MyPage.Dtos;

public class WatchedIssuesWidgetDto
{
    public int TotalCount { get; set; }
    public List<MyPageIssueDto> Issues { get; set; } = [];
}
