namespace Nexmine.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? PermissionsJson { get; set; }

    public List<ProjectMembership> ProjectMemberships { get; set; } = [];
}
