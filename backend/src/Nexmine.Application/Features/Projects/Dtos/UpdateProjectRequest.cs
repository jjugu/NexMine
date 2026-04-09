namespace Nexmine.Application.Features.Projects.Dtos;

public class UpdateProjectRequest
{
    public string? Name { get; set; }
    public string? Identifier { get; set; }
    public string? Description { get; set; }
    public bool? IsPublic { get; set; }
    public bool? IsArchived { get; set; }
}
