namespace Nexmine.Domain.Entities;

public class SavedQuery : BaseEntity
{
    public int UserId { get; set; }
    public int? ProjectId { get; set; }
    public string Name { get; set; } = "";
    public string FiltersJson { get; set; } = "{}";
    public bool IsPublic { get; set; }
    public int Position { get; set; }

    public User User { get; set; } = null!;
    public Project? Project { get; set; }
}
