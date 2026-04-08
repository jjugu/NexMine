namespace Nexmine.Domain.Entities;

public class Forum : BaseEntity
{
    public int ProjectId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int Position { get; set; }

    public Project Project { get; set; } = null!;
    public ICollection<ForumTopic> Topics { get; set; } = new List<ForumTopic>();
}
