namespace Nexmine.Application.Features.Admin.Dtos;

public class AdminStatusDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public int Position { get; set; }
}
