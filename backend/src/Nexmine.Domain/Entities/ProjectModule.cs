namespace Nexmine.Domain.Entities;

public class ProjectModule
{
    public int ProjectId { get; set; }
    public string ModuleName { get; set; } = "";

    public Project Project { get; set; } = null!;
}
