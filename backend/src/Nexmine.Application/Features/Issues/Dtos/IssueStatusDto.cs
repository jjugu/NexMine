namespace Nexmine.Application.Features.Issues.Dtos;

public class IssueStatusDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public int Position { get; set; }
}
