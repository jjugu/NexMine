namespace Nexmine.Application.Features.Issues.Dtos;

public class TrackerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Position { get; set; }
    public bool IsDefault { get; set; }
}
