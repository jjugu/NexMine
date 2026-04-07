namespace Nexmine.Domain.Entities;

public class IssueStatus : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public int Position { get; set; }

    public List<Issue> Issues { get; set; } = [];
}
