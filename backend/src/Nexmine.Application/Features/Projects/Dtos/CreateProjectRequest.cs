namespace Nexmine.Application.Features.Projects.Dtos;

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
}
