namespace Nexmine.Domain.Entities;

public class News : BaseEntity
{
    public int ProjectId { get; set; }
    public int AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? Description { get; set; }

    public Project Project { get; set; } = null!;
    public User Author { get; set; } = null!;
}
