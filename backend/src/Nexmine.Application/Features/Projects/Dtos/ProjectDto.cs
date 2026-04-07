namespace Nexmine.Application.Features.Projects.Dtos;

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; }
}
