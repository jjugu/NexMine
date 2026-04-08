namespace Nexmine.Application.Features.MyPage.Dtos;

public class MyIssuesWidgetDto
{
    public int TotalCount { get; set; }
    public List<MyPageIssueDto> Issues { get; set; } = [];
}
