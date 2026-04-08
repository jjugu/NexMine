namespace Nexmine.Application.Features.MyPage.Dtos;

public class OverdueIssuesWidgetDto
{
    public int TotalCount { get; set; }
    public List<MyPageIssueDto> Issues { get; set; } = [];
}
