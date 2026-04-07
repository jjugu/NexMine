namespace Nexmine.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
    public bool IsArchived { get; set; }

    public List<ProjectMembership> Members { get; set; } = [];
}
