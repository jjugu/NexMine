namespace Nexmine.Domain.Entities;

public class IssuePriority : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public int Position { get; set; }

    public List<Issue> Issues { get; set; } = [];
}
