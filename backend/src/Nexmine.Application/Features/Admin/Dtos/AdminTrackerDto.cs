namespace Nexmine.Application.Features.Admin.Dtos;

public class AdminTrackerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Position { get; set; }
    public bool IsDefault { get; set; }
}
