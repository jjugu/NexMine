namespace Nexmine.Application.Features.MyPage.Dtos;

public class MyPageIssueDto
{
    public int Id { get; set; }
    public string Subject { get; set; } = "";
    public string ProjectName { get; set; } = "";
    public string ProjectIdentifier { get; set; } = "";
    public string StatusName { get; set; } = "";
    public string PriorityName { get; set; } = "";
    public string? AssigneeName { get; set; }
    public DateOnly? DueDate { get; set; }
    public int DoneRatio { get; set; }
    public DateTime UpdatedAt { get; set; }
}
