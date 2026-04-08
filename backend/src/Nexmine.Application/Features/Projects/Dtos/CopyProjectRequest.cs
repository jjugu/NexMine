namespace Nexmine.Application.Features.Projects.Dtos;

public class CopyProjectRequest
{
    public string Name { get; set; } = "";
    public string Identifier { get; set; } = "";
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
    public bool CopyMembers { get; set; } = true;
    public bool CopyVersions { get; set; } = true;
    public bool CopyCategories { get; set; } = true;
    public bool CopyModules { get; set; } = true;
    public bool CopyWiki { get; set; }
    public bool CopyIssues { get; set; }
}
