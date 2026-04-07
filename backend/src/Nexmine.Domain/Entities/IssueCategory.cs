namespace Nexmine.Domain.Entities;

public class IssueCategory : BaseEntity
{
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;

    public Project Project { get; set; } = null!;
    public List<Issue> Issues { get; set; } = [];
}
