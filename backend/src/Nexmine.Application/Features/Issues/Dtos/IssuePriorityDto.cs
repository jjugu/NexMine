namespace Nexmine.Application.Features.Issues.Dtos;

public class IssuePriorityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public int Position { get; set; }
}
