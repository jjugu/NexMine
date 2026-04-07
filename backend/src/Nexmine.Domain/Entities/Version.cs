using Nexmine.Domain.Enums;

namespace Nexmine.Domain.Entities;

public class Version : BaseEntity
{
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public VersionStatus Status { get; set; }
    public DateOnly? DueDate { get; set; }

    public Project Project { get; set; } = null!;
    public List<Issue> Issues { get; set; } = [];
}
