namespace Nexmine.Domain.Entities;

public class Tracker : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int Position { get; set; }
    public bool IsDefault { get; set; }

    public List<Issue> Issues { get; set; } = [];
}
